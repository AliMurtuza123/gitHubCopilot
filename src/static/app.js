document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep default placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (hidden bullets). Add an unregister/delete button next to each participant.
          const participantsHtml =
            details.participants && details.participants.length
              ? `<div class="participants"><strong>Participants:</strong><ul class="participants-list">` +
                details.participants
                  .map((p) => {
                    const display = escapeHtml(p);
                    const initial = escapeHtml(String(p).trim()[0] || "").toUpperCase();
                    // Add a button with class `unregister-btn` and data attributes for activity and email
                    return `<li><span class="participant-badge">${initial}</span><span class="participant-email">${display}</span><button class="unregister-btn" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" aria-label="Unregister ${display}" title="Unregister">&times;</button></li>`;
                  })
                  .join("") +
                `</ul></div>`
              : `<p class="info">No participants yet.</p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

          // Attach click handlers for unregister buttons inside this activity card
          activityCard.querySelectorAll('.unregister-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              const activityName = btn.dataset.activity;
              const email = btn.dataset.email;

              if (!activityName || !email) return;

              if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });

                const result = await resp.json().catch(() => ({}));

                if (resp.ok) {
                  // Refresh the activities list so counts/options update
                  await fetchActivities();

                  messageDiv.textContent = result.message || 'Participant unregistered';
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Small helper to escape HTML content
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant without a page reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
