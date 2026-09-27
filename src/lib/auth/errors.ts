export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid username or password");
    this.name = "InvalidCredentialsError";
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Username is not available");
    this.name = "UsernameTakenError";
  }
}

export class EmailTakenError extends Error {
  constructor() {
    super("Email is not available");
    this.name = "EmailTakenError";
  }
}
