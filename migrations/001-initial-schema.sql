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

-- Down

DROP TABLE Message;
DROP TABLE User;
