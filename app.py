import os
from flask import Flask, render_template, send_file


app = Flask(__name__)


@app.route("/")
def home():
   return render_template('home.html')


@app.route("/signup")
def signup():
   return render_template('signup.html')


@app.route("/login")
def login():
   return render_template('login.html')


def main():
   app.run(port=int(os.environ.get('PORT', 80)))


if __name__ == "__main__":
   main()
