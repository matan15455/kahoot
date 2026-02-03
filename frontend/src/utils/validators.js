export const allowedPlatforms = [
  "gmail.com",
  "gmail.co.il",
  "outlook.com",
  "outlook.co.il",
  "walla.com",
  "walla.co.il",
  "hotmail.com",
  "hotmail.co.il",
  "yahoo.com",
  "yahoo.co.il",
  "icloud.com"
];

export const isValidEmail = (email) => {
  if (!email) return false;
  const basicCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!basicCheck) return false;
  const domain = email.split("@")[1].toLowerCase();
  return allowedPlatforms.includes(domain);
};

export const isValidPhone = (phone) =>
  /^(\+972|0)?-?5\d-?\d{7}$/.test(phone);

export const isAdult21 = (birthday) => {
  const birth = new Date(birthday);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return age > 21 || (age === 21 && m >= 0);
};

export const isValidPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

// פונקציה לבדיקת תקינות תעודת זהות
export const isValidID = (id) => {
  // רק ספרות
  if (!/^\d+$/.test(id)) return false;

  let sum = 0;
  let multiply = false;

  for (let i = id.length - 1; i >= 0; i--) {
    let num = Number(id[i]);

    if (multiply) {
      num *= 2;
      if (num > 9) num -= 9;
    }

    sum += num;
    multiply = !multiply;
  }

  // בדיקת ספרת ביקורת
  return sum % 10 === 0;
};
