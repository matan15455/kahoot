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
    // מוודא שכל התווים ספרות בלבד
    if (!/^\d+$/.test(id)) 
      return false;

    // מוסיף אפסים משמאל אם המספר קצר מ-9 ספרות
    id = id.padStart(9, "0");

    let sum = 0;

    for (let i = 0; i < 9; i++) {
      let num = parseInt(id[i], 10);

      // אם המיקום אי־זוגי (index 1,3,5,7) מכפילים ב־2
      if (i % 2 === 1) {
        num *= 2;
        if (num > 9) num -= 9; // סכום ספרות שווה ל־num-9
      }

      sum += num;
    }

    // מספר תקין אם הסכום מתחלק ב-10
    return sum % 10 === 0;
};