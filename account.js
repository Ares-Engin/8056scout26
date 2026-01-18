auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";
});

function changePassword() {
  const newPass = prompt("New password:");
  if (!newPass) return;
  auth.currentUser.updatePassword(newPass)
    .then(() => alert("Password updated"));
}

function deleteAccount() {
  if (!confirm("This will permanently delete your account")) return;
  auth.currentUser.delete().then(() => {
    alert("Account deleted");
    location.href = "index.html";
  });
}
