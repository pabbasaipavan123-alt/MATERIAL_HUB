const API_BASE = "http://localhost:5000/api";

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
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const notes = await res.json();
        renderNotes(notes);
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
        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          body: formData
        });

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
    const res = await fetch(`${API_BASE}/notes`);
    const notes = await res.json();
    renderNotes(notes);
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
    const res = await fetch(`${API_BASE}/notes/${id}`);
    const note = await res.json();
    noteMeta.innerHTML = `
      <h2>${note.title}</h2>
      <p>Subject: ${note.subject}</p>
      <p>Semester: ${note.semester}</p>
    `;
    pdfFrame.src = note.pdfUrl;
    if (pdfFallback) {
      pdfFallback.href = note.pdfUrl;
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this note and its PDF?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, { method: "DELETE" });
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
