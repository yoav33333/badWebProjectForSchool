import os
import sqlite3
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import pandas as pd
import requests
import yfinance as yf
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import threading
from flask_caching import Cache
import atexit

app = Flask(__name__)
app.secret_key = os.urandom(50)  # Set a secret key for session management


def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def runQuery(query, vars=None, fetch=False):
    conn = get_db_connection()
    c = conn.cursor()
    if vars is not None:
        c.execute(query, vars)
    else:
        c.execute(query)
    val = c.fetchall() if fetch else None
    conn.commit()
    conn.close()
    return val

def createTable():
    runQuery('''CREATE TABLE IF NOT EXISTS users
                 (username TEXT UNIQUE NOT NULL,
                 password TEXT NOT NULL,
                 email TEXT,
                 phone TEXT,
                 admin BOOL )''')

createTable()
def reset_expenses_and_stocks_tables():
    runQuery('''DROP TABLE IF EXISTS expenses''')
    runQuery('''CREATE TABLE expenses (
        username TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
    )''')

    runQuery('''DROP TABLE IF EXISTS transactions''')
    runQuery('''CREATE TABLE transactions (
        username TEXT NOT NULL,
        stock_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price_per_unit REAL NOT NULL,
        transaction_type TEXT NOT NULL, -- 'buy' or 'sell'
        transaction_date TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
    )''')
# create_expenses_and_stocks_tables()
def create_expenses_and_stocks_tables():
    runQuery('''CREATE TABLE IF NOT EXISTS expenses (
        username TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
    )''')

    runQuery('''CREATE TABLE IF NOT EXISTS transactions (
        username TEXT NOT NULL,
        stock_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price_per_unit REAL NOT NULL,
        transaction_type TEXT NOT NULL, -- 'buy' or 'sell'
        transaction_date TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
    )''')

    runQuery('''CREATE TABLE IF NOT EXISTS budgets (
        username TEXT PRIMARY KEY,
        budget REAL NOT NULL
    )''')
    # Add the salaries table
    runQuery('''CREATE TABLE IF NOT EXISTS salaries (
        username TEXT,
        salary REAL NOT NULL,
        FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
    )''')


create_expenses_and_stocks_tables()
def add_monthly_salary():
    global current_user
    # Fetch monthly salary
    salary_row = runQuery("SELECT salary FROM salaries WHERE username = ?", (current_user,), fetch=True)
    monthly_salary = salary_row[0]["salary"] if salary_row else 0

    # Update or insert the monthly income for the current month
    if monthly_salary > 0:
        runQuery(
            """
            INSERT INTO expenses (username, category, amount, date)
            VALUES (?, 'income', ?, date('now'))
            ON CONFLICT(username, category, date)
            DO UPDATE SET amount = excluded.amount
            """,
            (current_user, monthly_salary)
        )
        print(f"[{datetime.now()}] Monthly salary updated: {monthly_salary}")


def get_money_values(username):
    # Fetch net worth data
    net_worth_data = get_monthly_stock_data_with_net_worth(time_period="1y")

    # Get the latest net worth value
    latest_net_worth = net_worth_data[-1]["net_worth"] if net_worth_data else 0

    # Fetch monthly salary
    salary_data = runQuery(
        "SELECT salary FROM users WHERE username = ?",
        (username,), fetch=True
    )
    monthly_salary = salary_data[0]["salary"] if salary_data and salary_data[0]["salary"] is not None else 0

    # Fetch invested money
    invested_money_row = runQuery(
        "SELECT COALESCE(SUM(quantity * price_per_unit), 0) as invested_money FROM transactions WHERE username = ? AND transaction_type = 'buy'",
        (username,), fetch=True
    )
    invested_money = invested_money_row[0]["invested_money"] if invested_money_row else 0

    return {
        "current_money": latest_net_worth,
        "monthly_income": monthly_salary,
        "invested_money": invested_money
    }


scheduler = BackgroundScheduler()
scheduler.add_job(add_monthly_salary, 'interval', weeks=4)  # Runs approximately every month
scheduler.start()

# Ensure the scheduler shuts down properly on app exit
atexit.register(lambda: scheduler.shutdown())


@app.route("/api/stocks_data")
def stocks_data():
    global current_user
    user_id = runQuery("SELECT rowid FROM users WHERE username = ?", (current_user,), fetch=True)[0][0]
    stocks = runQuery("SELECT stock_name, SUM(quantity) as total FROM stocks WHERE user_id = ? GROUP BY stock_name", (user_id,), fetch=True)
    return {"labels": [row["stock_name"] for row in stocks], "data": [row["total"] for row in stocks]}
class User:
    def __init__(self, username, password):
        self.username = username
        self.password = password

class Users:
    def __init__(self, users=None):
        createTable()
        if users is None:
            users = []
        for i in users:
            runQuery("INSERT INTO users (username, password) VALUES (?, ?);", (i.username, i.password))

    def add_user(self, user):
        runQuery("INSERT INTO users (username, password) VALUES (?, ?);", (user.username, user.password))
    def is_admin(self, username):
        result = runQuery("SELECT admin FROM users WHERE username = ?;", (username,), fetch=True)
        try:
            print("res",result[0]["admin"])
            return result[0]["admin"] == 1
        except: return False
    def does_exists(self, username):
        result = runQuery("SELECT username FROM users WHERE username = ?;", (username,), fetch=True)
        return len(result) > 0

    def username_and_password_correct(self, username, password):
        result = runQuery("SELECT username, password FROM users WHERE username = ? AND password = ?;", (username, password), fetch=True)
        return len(result) > 0

users = Users()


current_user = "guest"
def set_admin(username):
    runQuery("UPDATE users SET admin = 1 WHERE username = ?", (username,))
def remove_admin(username):
    runQuery("UPDATE users SET admin = null WHERE username = ?", (username,))

def change_admin(username):
    admin = (1 if not users.is_admin(username) else None)
    print(admin)
    print(type(admin))
    if admin:
        set_admin(username)
    else:
        remove_admin(username)
    # runQuery("UPDATE users SET admin = ? WHERE username = ?", (username,admin,))


def validate_stock(stock_name):
    """
    Validates the stock name using yfinance.
    """
    try:
        stock = yf.Ticker(stock_name)
        info = stock.info
        if info and "symbol" in info:
            return True, {"1. symbol": info["symbol"]}
    except Exception as e:
        print(f"Error validating stock: {e}")
    return False, None

def get_stock_price(stock_symbol):
    """
    Fetches and caches the real-time stock price for the given stock symbol.
    """
    try:
        stock = yf.Ticker(stock_symbol)
        price = stock.history(period="1d")["Close"].iloc[-1]
        return float(price)
    except Exception as e:
        print(f"Error fetching stock price: {e}")
        return None


@app.route("/api/expenses_data")
def expenses_data():
    global current_user
    expenses = runQuery("SELECT category, SUM(amount) as total FROM expenses WHERE username = ? GROUP BY category", (current_user,), fetch=True)
    return {"labels": [row["category"] for row in expenses], "data": [row["total"] for row in expenses]}

# @app.route("/home")
# def home():
#     global current_user
#     if current_user == "guest":
#         flash("You must be logged in to view this page.", "error")
#         return redirect(url_for('login'))
#
#     # Fetch monthly budget
#     budget_row = runQuery("SELECT budget FROM budgets WHERE username = ?", (current_user,), fetch=True)
#     monthly_budget = budget_row[0]["budget"] if budget_row else 0
#
#     # Fetch expenses in the last month
#     expenses = runQuery(
#         "SELECT category, SUM(amount) as total FROM expenses WHERE username = ? AND date >= date('now', '-1 month') GROUP BY category",
#         (current_user,), fetch=True
#     )
#     expenses_data = {"labels": [row["category"] for row in expenses], "data": [row["total"] for row in expenses]}
#
#     return render_template('home.html', current_user=current_user, monthly_budget=monthly_budget, expenses_data=expenses_data)

@app.route("/expenses", methods=['GET', 'POST'])
def expenses():
    global current_user
    if current_user == "guest":
        return redirect(url_for('access_denied', reason='guest'))

    if request.method == 'POST':
        # Handle adding a new expense
        category = request.form['category']
        amount = float(request.form['amount'])
        date = request.form['date']
        runQuery(
            "INSERT INTO expenses (username, category, amount, date) VALUES (?, ?, ?, ?)",
            (current_user, category, amount, date)
        )
        flash("Expense added successfully!", "success")
        return redirect(url_for('expenses'))

    # Fetch expenses grouped by category for the current month
    expenses = runQuery(
        "SELECT category, SUM(amount) as total FROM expenses WHERE username = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now') GROUP BY category",
        (current_user,), fetch=True
    )

    # Prepare data for the chart
    expenses_data = {
        "labels": [row["category"] for row in expenses],
        "data": [row["total"] for row in expenses]
    }

    # Fetch monthly budget
    budget_row = runQuery("SELECT budget FROM budgets WHERE username = ?", (current_user,), fetch=True)
    monthly_budget = budget_row[0]["budget"] if budget_row else 0

    # Fetch monthly expenses for the bar chart
    monthly_expenses = runQuery(
        "SELECT strftime('%Y-%m', date) as month, category, SUM(amount) as total "
        "FROM expenses WHERE username = ? GROUP BY month, category ORDER BY month",
        (current_user,), fetch=True
    )

    # Prepare data for the bar chart
    chart_data = {}
    for row in monthly_expenses:
        month = row["month"]
        category = row["category"]
        total = row["total"]
        if month not in chart_data:
            chart_data[month] = {}
        chart_data[month][category] = total
    months = list(chart_data.keys())
    categories = list({cat for month_data in chart_data.values() for cat in month_data.keys()})
    bar_chart_data = {
        "months": months,
        "categories": categories,
        "data": [
            [chart_data[month].get(category, 0) for category in categories]
            for month in months
        ]
    }

    return render_template('expenses.html', bar_chart_data=bar_chart_data, expenses_data=expenses_data, monthly_budget=monthly_budget, is_admin = users.is_admin(current_user), current_user=current_user)






def get_company_names_and_symbols_as_array(file_path='stock_info.csv'):
    """
    Extracts company names and symbols from the stock_info.csv file and returns them as an array of strings.
    """
    try:
        # Read the CSV file
        df = pd.read_csv(file_path, header=None, names=["symbol", "name", "exchange"])

        # Create an array of strings in the format "symbol (name)"
        company_data = [f"{row['symbol']} ({row['name']})" for _, row in df.iterrows()]
        return company_data

    except Exception as e:
        print(f"Error reading the CSV file: {e}")
        return []


def get_weekly_stock_data(time_period="1y"):
    """
    Fetches weekly stock data for the specified time period.
    """
    global current_user
    transactions = runQuery(
        "SELECT stock_name, quantity, price_per_unit, transaction_type, transaction_date "
        "FROM transactions WHERE username = ?", (current_user,), fetch=True
    )
    transactions = [dict(row) for row in transactions]

    combined_data = {}

    for transaction in transactions:
        stock_symbol = transaction["stock_name"]
        transaction_date = pd.to_datetime(transaction["transaction_date"], utc=True)
        quantity = transaction["quantity"]
        transaction_type = transaction.get("transaction_type", "buy") or "buy"

        try:
            stock_data = yf.Ticker(stock_symbol)
            hist = stock_data.history(period=time_period, interval="1wk")
            if hist.empty:
                print(f"No historical data for {stock_symbol}")
                continue

            for date, row in hist.iterrows():
                if date >= transaction_date:
                    price = row["Close"]
                    if not pd.isna(price):
                        date_str = date.strftime("%Y-%m-%d")
                        if date_str not in combined_data:
                            combined_data[date_str] = 0
                        if transaction_type == "buy":
                            combined_data[date_str] += price * quantity
                        elif transaction_type == "sell":
                            combined_data[date_str] -= price * quantity
        except Exception as e:
            print(f"Error fetching data for {stock_symbol}: {e}")

    return [{"date": date, "price": price} for date, price in sorted(combined_data.items())]


@app.route("/")
def home():
    global current_user
    if request.cookies.get("username"):
        current_user = request.cookies.get("username")
    if current_user == "guest":
        # Pass empty data for guests to avoid serialization issues
        expenses_data = {"labels": [], "data": []}
        stocks_data = {"labels": [], "data": []}
        return render_template('home.html', current_user=current_user, is_admin=False,
                               expenses_data=expenses_data, stocks_data=stocks_data)

    # Fetch data for logged-in users
    expenses = runQuery("SELECT category, SUM(amount) as total FROM expenses WHERE username = ? GROUP BY category",
                        (current_user,), fetch=True)
    transactions = runQuery(
        "SELECT stock_name, quantity, price_per_unit, transaction_type, transaction_date "
        "FROM transactions WHERE username = ?", (current_user,), fetch=True
    )
    transactions = [dict(row) for row in transactions]
    budget_row = runQuery("SELECT budget FROM budgets WHERE username = ?", (current_user,), fetch=True)

    monthly_budget = budget_row[0]["budget"] if budget_row else 0

    expenses_data = {"labels": [row["category"] for row in expenses], "data": [row["total"] for row in expenses]}
    # stocks_data = {"labels": [row["stock_name"] for row in transactions], "data": [row["quantity"] for row in transactions]}

    weekly_data = get_weekly_stock_data()

    return render_template('home.html', current_user=current_user, is_admin=users.is_admin(current_user),
                           expenses_data=expenses_data, weekly_data=weekly_data, monthly_budget=monthly_budget)


@app.route("/stocks", methods=['GET', 'POST'])
def stocks():
    global current_user
    if current_user == "guest":
        return redirect(url_for('access_denied', reason='guest'))

    time_period = request.args.get("time_period", "1y")  # Default to 1 year

    if request.method == 'POST':
        action = request.form.get('action')
        stock_name = request.form['stock_name'].split(' ')[0]
        quantity = int(request.form['quantity'])
        date = request.form['purchase_date'] if action == "buy" else request.form['sell_date']

        # Validate future date
        if pd.to_datetime(date) > pd.Timestamp.now():
            flash("Date cannot be in the future.", "error")
            return redirect(url_for('stocks'))

        if action == "buy":
            is_valid, stock_data = validate_stock(stock_name)
            if not is_valid:
                flash("Invalid stock name or unable to fetch stock price. Please try again.", "error")
                return redirect(url_for('stocks'))

            stock_symbol = stock_data["1. symbol"]
            stock_price = get_stock_price(stock_symbol)
            if stock_price is None:
                flash("Unable to fetch stock price. Please try again.", "error")
                return redirect(url_for('stocks'))

            # Insert into transactions table
            runQuery(
                "INSERT INTO transactions (username, stock_name, quantity, price_per_unit, transaction_type, transaction_date) VALUES (?, ?, ?, ?, ?, ?)",
                (current_user, stock_name, quantity, stock_price, "buy", date))

            flash(f"Stock bought successfully! Current price: ${stock_price}", "success")
            weekly_data = get_weekly_stock_data(time_period)

            return {"success": True, "weekly_data": weekly_data}
        elif action == "sell":
            # Check total quantity owned
            total_quantity = runQuery(
                "SELECT COALESCE(SUM(quantity), 0) as total_quantity FROM transactions WHERE username = ? AND stock_name = ? AND transaction_type = 'buy'",
                (current_user, stock_name), fetch=True
            )[0]["total_quantity"]

            # Subtract sold quantities
            sold_quantity = runQuery(
                "SELECT COALESCE(SUM(quantity), 0) as sold_quantity FROM transactions WHERE username = ? AND stock_name = ? AND transaction_type = 'sell'",
                (current_user, stock_name), fetch=True
            )[0]["sold_quantity"]

            available_quantity = total_quantity - sold_quantity

            if available_quantity < quantity:
                flash("Not enough stock to sell.", "error")
                return redirect(url_for('stocks'))

            # Insert into transactions table
            runQuery(
                "INSERT INTO transactions (username, stock_name, quantity, price_per_unit, transaction_type, transaction_date) VALUES (?, ?, ?, ?, ?, ?)",
                (current_user, stock_name, quantity, 0, "sell", date))

            flash(f"Stock sold successfully!", "success")
            weekly_data = get_weekly_stock_data(time_period)

            return {"success": True, "weekly_data": weekly_data}
        # Fetch updated weekly data for the chart
        weekly_data = get_weekly_stock_data(time_period)

        return {"success": True, "weekly_data": weekly_data}

    transactions = runQuery(
        "SELECT stock_name, quantity, price_per_unit, transaction_type, transaction_date FROM transactions WHERE username = ?",
        (current_user,), fetch=True
    )
    transactions = [dict(row) for row in transactions]

    weekly_data = get_weekly_stock_data(time_period)
    return render_template('stocks.html', stocks=transactions, current_user=current_user, weekly_data=weekly_data, companies=get_company_names_and_symbols_as_array(), time_period=time_period,is_admin = users.is_admin(current_user))
def get_monthly_stock_data_with_net_worth(time_period="1y", monthly_salary=5000, salary_start_date="2023-01"):
    global current_user

    # Fetch transactions
    transactions = runQuery(
        "SELECT stock_name, quantity, price_per_unit, transaction_type, transaction_date "
        "FROM transactions WHERE username = ?", (current_user,), fetch=True
    )
    transactions = [dict(row) for row in transactions]

    # Fetch expenses grouped by month
    expenses = runQuery(
        "SELECT strftime('%Y-%m', date) as month, SUM(amount) as total_expenses "
        "FROM expenses WHERE username = ? GROUP BY month",
        (current_user,), fetch=True
    )
    expenses = {row["month"]: row["total_expenses"] for row in expenses}

    # Initialize stock value data
    stock_values = {}

    # Process stock transactions
    for transaction in transactions:
        stock_symbol = transaction["stock_name"]
        transaction_date = pd.to_datetime(transaction["transaction_date"]).tz_localize(None)
        quantity = transaction["quantity"]
        transaction_type = transaction.get("transaction_type", "buy") or "buy"

        try:
            stock_data = yf.Ticker(stock_symbol)
            hist = stock_data.history(period=time_period, interval="1d")
            if hist.empty:
                print(f"No historical data for {stock_symbol}")
                continue

            hist.index = hist.index.tz_localize(None)
            hist["Month"] = hist.index.to_period("M")
            last_week_data = hist.groupby("Month").last()

            for date, row in last_week_data.iterrows():
                if date.to_timestamp() >= transaction_date:
                    price = row["Close"]
                    if not pd.isna(price):
                        month_str = date.strftime("%Y-%m")
                        if month_str not in stock_values:
                            stock_values[month_str] = 0
                        if transaction_type == "buy":
                            stock_values[month_str] += price * quantity
                        elif transaction_type == "sell":
                            stock_values[month_str] -= price * quantity
        except Exception as e:
            print(f"Error fetching data for {stock_symbol}: {e}")
    salary_start_date_row = runQuery("SELECT salary_start_date FROM users WHERE username = ?", (current_user,),
                                     fetch=True)
    if salary_start_date_row and salary_start_date_row[0]["salary_start_date"]:
        salary_start_date = pd.to_datetime(salary_start_date_row[0]["salary_start_date"]).strftime("%Y-%m")
    else:
        print("Salary start date not found for the current user.")

    # salary_start_date = pd.to_datetime(salary_start_date).strftime("%Y-%m")
    all_months = sorted(set(list(expenses.keys()) + list(stock_values.keys())))
    carry_over_money = 0
    # Calculate net worth
    try:
        if pd.to_datetime(all_months[0]) >= pd.to_datetime(salary_start_date):
            carry_over_money = (pd.to_datetime(all_months[0]).month-pd.to_datetime(salary_start_date).month) * monthly_salary
    except:
        print("Error calculating carry over money.")
    net_worth_data = []
    print(salary_start_date)

    for month_str in all_months:
        # Start with carry-over money from the previous month
        net_worth = carry_over_money

        # Add monthly salary if the month is on or after the salary start date
        if pd.to_datetime(month_str) >= pd.to_datetime(salary_start_date):
            net_worth += monthly_salary

        # Subtract expenses for the month
        if month_str in expenses:
            net_worth -= expenses[month_str]

        # Add stock value for the month
        stock_value = stock_values.get(month_str, 0)
        net_worth += stock_value

        # Save carry-over money for the next month (excluding stock value)
        carry_over_money = net_worth - stock_value

        # Append the net worth for the month
        net_worth_data.append({
            "month": month_str,
            "net_worth": float(net_worth),
            "stock_value": float(stock_value),
            "carry_over_money": float(carry_over_money)
        })

    return net_worth_data

@app.route("/access_denied")
def access_denied():
    reason = request.args.get('reason', 'guest')  # Default to 'guest'
    return render_template('accessDenied.html', reason=reason, is_admin = users.is_admin(current_user), current_user=current_user)

@app.route('/update_money', methods=['POST'])
def update_money():
    current_money = request.form.get('current_money')
    # Add logic to update the money in your database or application state
    print(f"Updated current money: {current_money}")
    return redirect(url_for('money_management'))  # Redirect back to the money management page




@app.route("/money_management", methods=['GET', 'POST'])
def money_management():
    global current_user
    if current_user == "guest":
        return redirect(url_for('access_denied', reason='guest'))

    if request.method == 'POST':
        if 'monthly_income' in request.form and 'income_date' in request.form:
            monthly_income = float(request.form['monthly_income'])
            income_date = request.form['income_date']
            runQuery(
                "UPDATE users SET salary = ?, salary_start_date = ? WHERE username = ?",
                (monthly_income, income_date, current_user)
            )
            flash("Monthly income updated successfully!", "success")
        elif 'monthly_budget' in request.form:
            monthly_budget = float(request.form['monthly_budget'])
            runQuery("INSERT OR REPLACE INTO budgets (username, budget) VALUES (?, ?)", (current_user, monthly_budget))
            flash("Monthly budget updated successfully!", "success")

    # Fetch money values
    money_values = get_money_values(current_user)
    current_money = money_values["current_money"]
    monthly_income = money_values["monthly_income"]
    invested_money = money_values["invested_money"]

    # Fetch monthly budget
    budget_row = runQuery("SELECT budget FROM budgets WHERE username = ?", (current_user,), fetch=True)
    monthly_budget = budget_row[0]["budget"] if budget_row else 0

    # Fetch expenses data
    expenses = runQuery(
        "SELECT category, SUM(amount) as total FROM expenses WHERE username = ? AND date >= date('now', '-1 month') GROUP BY category",
        (current_user,), fetch=True
    )
    expenses_data = {"labels": [row["category"] for row in expenses], "data": [row["total"] for row in expenses]}

    # Calculate remaining budget
    remaining_budget = monthly_budget - sum(expenses_data["data"])

    # Calculate net worth
    # Calculate net worth
    net_worth_data = get_monthly_stock_data_with_net_worth(time_period="1y",
                                                           monthly_salary=money_values["monthly_income"])
    try:
        current_net_worth = net_worth_data[-1]["net_worth"]
    except:
        current_net_worth = 0
    net_worth_data_json = jsonify(net_worth_data).get_json()  # Convert to JSON
    print(net_worth_data)

    return render_template(
        'moneyManagement.html',
        current_user=current_user,
        monthly_income=monthly_income,
        current_money=net_worth_data[-1]["net_worth"],
        invested_money=invested_money,
        remaining_budget=remaining_budget,
        monthly_budget=monthly_budget,
        expenses_data=expenses_data,
        net_worth_data=net_worth_data_json,
        is_admin = users.is_admin(current_user)
    )



@app.route("/sign_out")
def sign_out():
    global current_user
    current_user = "guest"
    ret = redirect(url_for('home'))
    ret.set_cookie('username', "guest")
    return ret
@app.route("/signup", methods=['GET', 'POST'])
def signup():
    global current_user
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if users.does_exists(username):
            return render_template('signup.html', error="User already exists", current_user=current_user, is_admin=users.is_admin(current_user))
        current_user = username
        users.add_user(User(username, password))
        ret = redirect(url_for('home'))
        ret.set_cookie('username', username)
        return ret
    return render_template('signup.html',current_user=current_user, is_admin=users.is_admin(current_user))
@app.route("/users", methods=['GET', 'POST'])
def users_table():
    global current_user
    if request.method == 'POST':
        username = request.form['users']
        print(request.form['action'])
        if request.form['action'] == 'delete user':
            runQuery("DELETE FROM users WHERE username = ?", (username,))
            flash(f"User {username} deleted successfully!", "success")
            return redirect(url_for('users_table'))
        else:
            change_admin(username)
            # runQuery("UPDATE users SET admin = 1 WHERE username = ?", (username,))
            # "UPDATE users SET salary = ?, salary_start_date = ? WHERE username = ?",
            flash(f"User {username} changged to {'admin' if  users.is_admin(username) else 'user'} successfully!", "success")
            return redirect(url_for('users_table'))
    if users.is_admin(current_user):
        return render_template('users.html', current_user=current_user,
           users=runQuery("SELECT * FROM users", fetch=True), is_admin=users.is_admin(current_user))
    return redirect(url_for('access_denied', reason='no_access'))


@app.route("/newBase")
def newBase():
    return render_template('newBase.html')

@app.route("/login", methods=['GET', 'POST'])
def login():
    global current_user
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        n = username is None or password is None
        if users.username_and_password_correct(username, password):
            global current_user
            current_user = username
            ret = redirect(url_for('home'))
            ret.set_cookie('username', username)
            return ret
        return render_template('login.html', error=""if n else  "Username or password are incorrect", current_user=current_user, is_admin=users.is_admin(current_user))
    return render_template('login.html', current_user=current_user, is_admin=users.is_admin(current_user))

def main():
    app.run(port=int(os.environ.get('PORT', 80)))

if __name__ == "__main__":
    main()