-- Up

CREATE TABLE Message (
  id INTEGER PRIMARY KEY,
  body STRING
);

CREATE TABLE User (
  id INTEGER PRIMARY KEY,
  username STRING UNIQUE,
  passwordHash STRING
);

CREATE TABLE AuthToken (
  token STRING PRIMARY KEY,
  userId STRING,
  FOREIGN KEY(userId) REFERENCES User(id)
);

-- Down

DROP TABLE Message;
DROP TABLE User;
DROP TABLE AuthToken;
