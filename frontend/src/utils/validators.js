export function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateTriageForm(form) {
  if (!form.age || !form.gender || !form.symptoms || !form.duration || !form.severity) {
    return "Please complete age, gender, symptoms, duration, and severity.";
  }

  return "";
}

export function validateAuthForm(form, mode) {
  if (mode === "register" && !form.name.trim()) {
    return "Please enter your name.";
  }
  if (!form.email.includes("@")) {
    return "Please enter a valid email address.";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return "";
}
