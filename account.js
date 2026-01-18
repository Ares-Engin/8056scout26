const auth = firebase.auth();

/**
 * Send password reset email
 */
function resetPassword() {
  const user = auth.currentUser;
  if (!user) {
    alert("Not logged in");
    return;
  }

  auth.sendPasswordResetEmail(user.email)
    .then(() => {
      alert("Password reset email sent to " + user.email);
    })
    .catch(err => {
      alert(err.message);
    });
}

/**
 * Permanently delete account
 */
function deleteAccount() {
  const user = auth.currentUser;
  if (!user) return;

  if (!confirm("Are you sure you want to permanently delete your account?")) {
    return;
  }

  user.delete()
    .then(() => {
      alert("Account deleted");
      location.href = "index.html";
    })
    .catch(err => {
      alert(
        "For security reasons, please log out and log back in, then try again.\n\n" +
        err.message
      );
    });
}
