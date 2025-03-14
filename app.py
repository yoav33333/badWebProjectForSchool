import os
import sqlite3
from flask import Flask, render_template, request

app = Flask(__name__)

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
            print(result[0])
            return True
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
set_admin("admin")
@app.route("/")
def home():
    return render_template('home.html', current_user=current_user, is_admin=users.is_admin(current_user))

@app.route("/sign_out")
def sign_out():
    global current_user
    current_user = "guest"
    return render_template('home.html', current_user=current_user, is_admin=users.is_admin(current_user))

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
        return render_template('home.html', current_user=current_user, is_admin=users.is_admin(current_user))
    return render_template('signup.html',current_user=current_user, is_admin=users.is_admin(current_user))
@app.route("/users", methods=['GET', 'POST'])
def users_table():
    global current_user
    if users.is_admin(current_user):
        return render_template('users.html',current_user=current_user, users=runQuery("SELECT * FROM users", fetch=True), is_admin=users.is_admin(current_user))
    return "you dont have permission to view this page"

@app.route("/newBase")
def newBase():
    return render_template('newBase.html')

@app.route("/login", methods=['GET', 'POST'])
def login():
    global current_user
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if users.username_and_password_correct(username, password):
            global current_user
            current_user = username
            return render_template('home.html', current_user=username, is_admin=users.is_admin(current_user))
        return render_template('login.html', error="Username or password are incorrect", current_user=current_user, is_admin=users.is_admin(current_user))
    return render_template('login.html', current_user=current_user, is_admin=users.is_admin(current_user))

def main():
    app.run(port=int(os.environ.get('PORT', 80)))

if __name__ == "__main__":
    main()