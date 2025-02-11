import os
from flask import Flask, render_template, send_file, request

app = Flask(__name__)

class User:
   def __init__(self, username, password):
      self.username = username
      self.password = password


class Users:
   def __init__(self, users=None):
      if users is None:
          users = []
      self.users = users

   def add_user(self, user):
      self.users.append(user)

   def does_exists(self, username):
      for user in self.users:
         if user.username == username:
            return True
      return False

   def username_and_password_correct(self, username, password):
      for user in self.users:
         if user.username == username and user.password == password:
            return user
users = Users([User("admin", "admin"), User("yoav", "1234")])
current_user = "guest"

@app.route("/")
def home():
   return render_template('home.html', current_user = current_user)


@app.route("/sign_out")
def sign_out():
   global current_user
   current_user = "guest"
   return render_template('home.html', current_user = current_user)
@app.route("/signup", methods = ['GET', 'POST'])
def signup():
   print("")
   if request.method == 'POST':
      print(request.form)
      username = request.form['username']
      password = request.form['password']
      if users.does_exists(username):
         return render_template('signup.html', error="User already exists")
      global current_user
      current_user = username
      users.add_user(User(username, password))
      return render_template('home.html', current_user = current_user)
   return render_template('signup.html')
@app.route("/newBase")
def newBase():
   return render_template('newBase.html')


@app.route("/login", methods = ['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if users.username_and_password_correct(username, password):
            global current_user
            current_user = username
            return render_template('home.html', current_user = username)
        return render_template('login.html', error="Username or password are incorrect")
    return render_template('login.html')


def main():
   app.run(port=int(os.environ.get('PORT', 80)))


if __name__ == "__main__":
   main()
