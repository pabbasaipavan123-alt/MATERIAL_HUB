const API_BASE = "https://material-hub-al3n.onrender.com/api";



async function fetchWithRetry(url, options = {}, onRetry) {
  let attempt = 0;
  while (true) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt >= COLD_START_RETRIES) throw err;
      attempt += 1;
      if (onRetry) onRetry(attempt);
      await sleep(COLD_START_DELAY_MS);
    }
  }
}

async function fetchJsonWithRetry(url, options = {}, onRetry) {
  const res = await fetchWithRetry(url, options, onRetry);
  const data = await res.json().catch(() => null);
  return { res, data };
}

const COLD_START_RETRIES = 2;
const COLD_START_DELAY_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, onRetry) {
  let attempt = 0;
  while (true) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt >= COLD_START_RETRIES) throw err;
      attempt += 1;
      if (onRetry) onRetry(attempt);
      await sleep(COLD_START_DELAY_MS);
    }
  }
}

async function fetchJsonWithRetry(url, options = {}, onRetry) {
  const res = await fetchWithRetry(url, options, onRetry);
  const data = await res.json().catch(() => null);
  return { res, data };
}


document.addEventListener("DOMContentLoaded", () => {
  const notesGrid = document.getElementById("notesGrid");
  const searchInput = document.getElementById("searchInput");
  const noteMeta = document.getElementById("noteMeta");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfFallback = document.getElementById("pdfFallback");
  const deleteNoteBtn = document.getElementById("deleteNoteBtn");
  const uploadForm = document.getElementById("uploadForm");
  const formMsg = document.getElementById("formMsg");

  if (notesGrid) {
    fetchNotes();

    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      if (!query) {
        fetchNotes();
      } else {
        try {
          const result = await fetchJsonWithRetry(
            `${API_BASE}/search?q=${encodeURIComponent(query)}`,
            {},
            () => {
              notesGrid.innerHTML = `<div class="card">Waking up server...</div>`;
            }
          );

          if (!result.res || !result.res.ok) {
            return;
          }
          renderNotes(result.data || []);
        } catch (err) {
          notesGrid.innerHTML = `<div class="card">Failed to search</div>`;
        }
      }
    });
  }

  if (noteMeta && pdfFrame) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      fetchNote(id);
      if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener("click", () => handleDelete(id));
      }
    }
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      formMsg.textContent = "Uploading...";
      const formData = new FormData(uploadForm);

      try {
        const res = await fetchWithRetry(
          `${API_BASE}/upload`,
          {
            method: "POST",
            body: formData
          },
          () => {
            formMsg.textContent = "Waking up server...";
          }
        );

        if (!res.ok) {
          const err = await res.json();
          formMsg.textContent = err.error || "Upload failed";
          return;
        }

        const newNote = await res.json();
        formMsg.textContent = "Upload successful!";
        uploadForm.reset();
        window.location.href = `note.html?id=${newNote._id}`;
      } catch (err) {
        formMsg.textContent = "Upload failed";
      }
    });
  }

  async function fetchNotes() {
    try {
      notesGrid.innerHTML = `<div class="card">Loading...</div>`;
      const result = await fetchJsonWithRetry(
        `${API_BASE}/notes`,
        {},
        () => {
          notesGrid.innerHTML = `<div class="card">Waking up server...</div>`;
        }
      );

      if (!result.res || !result.res.ok) {
        notesGrid.innerHTML = `<div class="card">Failed to load notes</div>`;
        return;
      }
      renderNotes(result.data || []);
    } catch (err) {
      notesGrid.innerHTML = `<div class="card">Failed to load notes</div>`;
    }
  }

  function renderNotes(notes) {
    notesGrid.innerHTML = "";
    if (!notes.length) {
      notesGrid.innerHTML = `<div class="card">No notes found</div>`;
      return;
    }
    notes.forEach((note) => {
      const card = document.createElement("div");
      card.className = "card note-card";
      card.innerHTML = `
        <h3>${note.title}</h3>
        <p>Subject: ${note.subject}</p>
        <p>Semester: ${note.semester}</p>
        <button>View PDF</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        window.location.href = `note.html?id=${note._id}`;
      });
      notesGrid.appendChild(card);
    });
  }

  async function fetchNote(id) {
    try {
      noteMeta.innerHTML = "<p>Loading...</p>";
      const result = await fetchJsonWithRetry(
        `${API_BASE}/notes/${id}`,
        {},
        () => {
          noteMeta.innerHTML = "<p>Waking up server...</p>";
        }
      );

      if (!result.res || !result.res.ok || !result.data) {
        noteMeta.innerHTML = "<p>Failed to load note.</p>";
        return;
      }

      const note = result.data;
      noteMeta.innerHTML = `
        <h2>${note.title}</h2>
        <p>Subject: ${note.subject}</p>
        <p>Semester: ${note.semester}</p>
      `;
      pdfFrame.src = note.pdfUrl;
      if (pdfFallback) {
        pdfFallback.href = note.pdfUrl;
      }
    } catch (err) {
      noteMeta.innerHTML = "<p>Failed to load note.</p>";
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this note and its PDF?");
    if (!ok) return;
    try {
      const res = await fetchWithRetry(
        `${API_BASE}/notes/${id}`,
        { method: "DELETE" },
        () => {
          alert("Waking up server...");
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }
      window.location.href = "index.html";
    } catch (err) {
      alert("Delete failed");
    }
  }

});
