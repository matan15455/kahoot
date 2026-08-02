export const isValidUsername = (username) =>
  /^[a-zA-Zא-ת0-9]{3,20}$/.test(username);

export const isValidPassword = (password) =>
  /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
