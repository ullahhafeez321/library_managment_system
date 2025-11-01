const { ipcRenderer } = require("electron");

// Navigation
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = e.target.dataset.page;
    showPage(page);
  });
});

function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelector(`#${pageId}-section`).classList.add("active");
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  document.querySelector(`[data-page="${pageId}"]`).classList.add("active");
}

// Books Management
document.getElementById("save-book").addEventListener("click", async () => {
  const form = document.getElementById("add-book-form");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("add-book", bookData);
    Swal.fire("Success", "Book added successfully!", "success");
    form.reset();
    $("#addBookModal").modal("hide");
    loadBooks();
  } catch (error) {
    Swal.fire("Error", "Failed to add book: " + error.message, "error");
  }
});

async function loadBooks() {
  try {
    const books = await ipcRenderer.invoke("get-books");
    const tbody = document.querySelector("#books-table tbody");
    tbody.innerHTML = "";

    books.forEach((book) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn || "-"}</td>
                <td>${book.category || "-"}</td>
                <td>${book.available}/${book.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action edit-book" data-id="${
                      book.id
                    }">Edit</button>
                    <button class="btn btn-sm btn-danger btn-action delete-book" data-id="${
                      book.id
                    }">Delete</button>
                </td>
            `;
      tbody.appendChild(row);
    });

    // Update dashboard
    document.getElementById("total-books").textContent = books.reduce(
      (sum, book) => sum + book.quantity,
      0
    );
    document.getElementById("available-books").textContent = books.reduce(
      (sum, book) => sum + book.available,
      0
    );
  } catch (error) {
    Swal.fire("Error", "Failed to load books: " + error.message, "error");
  }
}

// Members Management
document.getElementById("save-member").addEventListener("click", async () => {
  const form = document.getElementById("add-member-form");
  const formData = new FormData(form);
  const memberData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("add-member", memberData);
    Swal.fire("Success", "Member added successfully!", "success");
    form.reset();
    $("#addMemberModal").modal("hide");
    loadMembers();
  } catch (error) {
    Swal.fire("Error", "Failed to add member: " + error.message, "error");
  }
});

async function loadMembers() {
  try {
    const members = await ipcRenderer.invoke("get-members");
    const tbody = document.querySelector("#members-table tbody");
    tbody.innerHTML = "";

    members.forEach((member) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.contact || "-"}</td>
                <td>${member.address || "-"}</td>
                <td>${new Date(member.join_date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action edit-member" data-id="${
                      member.id
                    }">Edit</button>
                    <button class="btn btn-sm btn-danger btn-action delete-member" data-id="${
                      member.id
                    }">Delete</button>
                </td>
            `;
      tbody.appendChild(row);
    });

    // Update dashboard
    document.getElementById("total-members").textContent = members.length;
  } catch (error) {
    Swal.fire("Error", "Failed to load members: " + error.message, "error");
  }
}

// Borrowings Management
document
  .getElementById("save-borrowing")
  .addEventListener("click", async () => {
    const form = document.getElementById("add-borrowing-form");
    const formData = new FormData(form);
    const borrowData = Object.fromEntries(formData.entries());

    try {
      await ipcRenderer.invoke("borrow-book", borrowData);
      Swal.fire("Success", "Book borrowed successfully!", "success");
      form.reset();
      $("#addBorrowingModal").modal("hide");
      loadBorrowings();
      loadBooks(); // Refresh books to update availability
    } catch (error) {
      Swal.fire("Error", "Failed to borrow book: " + error.message, "error");
    }
  });

async function loadBorrowings() {
  try {
    const borrowings = await ipcRenderer.invoke("get-borrowings");
    const tbody = document.querySelector("#borrowings-table tbody");
    tbody.innerHTML = "";

    borrowings.forEach((borrowing) => {
      const row = document.createElement("tr");
      const status = borrowing.return_date
        ? "returned"
        : new Date(borrowing.due_date) < new Date()
        ? "overdue"
        : "borrowed";

      row.innerHTML = `
                <td>${borrowing.id}</td>
                <td>${borrowing.book_title}</td>
                <td>${borrowing.member_name}</td>
                <td>${new Date(borrowing.borrow_date).toLocaleDateString()}</td>
                <td>${new Date(borrowing.due_date).toLocaleDateString()}</td>
                <td><span class="badge badge-${status}">${status}</span></td>
                <td>
                    ${
                      status === "borrowed"
                        ? `
                        <button class="btn btn-sm btn-success btn-action return-book" data-id="${borrowing.id}">Return</button>
                    `
                        : "-"
                    }
                </td>
            `;
      tbody.appendChild(row);
    });

    // Update dashboard
    document.getElementById("active-borrowings").textContent =
      borrowings.filter((b) => !b.return_date).length;
  } catch (error) {
    Swal.fire("Error", "Failed to load borrowings: " + error.message, "error");
  }
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  loadMembers();
  loadBorrowings();
});

// Event delegation for dynamic buttons
document.addEventListener("click", async (e) => {
  if (e.target.matches(".return-book")) {
    const id = e.target.dataset.id;
    try {
      await ipcRenderer.invoke("return-book", id);
      Swal.fire("Success", "Book returned successfully!", "success");
      loadBorrowings();
      loadBooks();
    } catch (error) {
      Swal.fire("Error", "Failed to return book: " + error.message, "error");
    }
  }
});

// ====================== EDIT & DELETE: BOOKS ======================
document.addEventListener("click", async (e) => {
  // DELETE BOOK
  if (e.target.matches(".delete-book")) {
    const id = e.target.dataset.id;
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the book!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await ipcRenderer.invoke("delete-book", id);
        Swal.fire("Deleted!", "Book deleted successfully.", "success");
        loadBooks();
      } catch (error) {
        Swal.fire("Error", "Failed to delete book: " + error.message, "error");
      }
    }
  }

  // EDIT BOOK
  if (e.target.matches(".edit-book")) {
    const id = e.target.dataset.id;
    const books = await ipcRenderer.invoke("get-books");
    const book = books.find((b) => b.id == id);

    if (!book) return;

    // Fill modal form
    document.querySelector("#edit-book-id").value = book.id;
    document.querySelector("#edit-title").value = book.title;
    document.querySelector("#edit-author").value = book.author;
    document.querySelector("#edit-isbn").value = book.isbn;
    document.querySelector("#edit-category").value = book.category;
    document.querySelector("#edit-quantity").value = book.quantity;
    document.querySelector("#edit-available").value = book.available;

    $("#editBookModal").modal("show");
  }
});

document.getElementById("update-book").addEventListener("click", async () => {
  const form = document.getElementById("edit-book-form");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("update-book", bookData);
    Swal.fire("Updated!", "Book updated successfully!", "success");
    $("#editBookModal").modal("hide");
    loadBooks();
  } catch (error) {
    Swal.fire("Error", "Failed to update book: " + error.message, "error");
  }
});

// ====================== EDIT & DELETE: MEMBERS ======================
document.addEventListener("click", async (e) => {
  // DELETE MEMBER
  if (e.target.matches(".delete-member")) {
    const id = e.target.dataset.id;
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the member!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await ipcRenderer.invoke("delete-member", id);
        Swal.fire("Deleted!", "Member deleted successfully.", "success");
        loadMembers();
      } catch (error) {
        Swal.fire(
          "Error",
          "Failed to delete member: " + error.message,
          "error"
        );
      }
    }
  }

  // EDIT MEMBER
  if (e.target.matches(".edit-member")) {
    const id = e.target.dataset.id;
    const members = await ipcRenderer.invoke("get-members");
    const member = members.find((m) => m.id == id);

    if (!member) return;

    // Fill modal form
    document.querySelector("#edit-member-id").value = member.id;
    document.querySelector("#edit-name").value = member.name;
    document.querySelector("#edit-contact").value = member.contact;
    document.querySelector("#edit-address").value = member.address;

    $("#editMemberModal").modal("show");
  }
});

document.getElementById("update-member").addEventListener("click", async () => {
  const form = document.getElementById("edit-member-form");
  const formData = new FormData(form);
  const memberData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("update-member", memberData);
    Swal.fire("Updated!", "Member updated successfully!", "success");
    $("#editMemberModal").modal("hide");
    loadMembers();
  } catch (error) {
    Swal.fire("Error", "Failed to update member: " + error.message, "error");
  }
});

async function populateBooksDropdown() {
  try {
    const books = await ipcRenderer.invoke("get-books");
    const bookSelect = document.getElementById("borrow-book-id");
    bookSelect.innerHTML = '<option value="">Select Book</option>';

    books
      .filter((book) => book.available > 0)
      .forEach((book) => {
        const option = document.createElement("option");
        option.value = book.id;
        option.textContent = `${book.title} (${book.available}/${book.quantity})`;
        bookSelect.appendChild(option);
      });
  } catch (error) {
    Swal.fire(
      "Error",
      "Failed to load books for dropdown: " + error.message,
      "error"
    );
  }
}

async function populateMembersDropdown() {
  try {
    const members = await ipcRenderer.invoke("get-members");
    const memberSelect = document.getElementById("borrow-member-id");
    memberSelect.innerHTML = '<option value="">Select Member</option>';

    members.forEach((member) => {
      const option = document.createElement("option");
      option.value = member.id;
      option.textContent = member.name;
      memberSelect.appendChild(option);
    });
  } catch (error) {
    Swal.fire(
      "Error",
      "Failed to load members for dropdown: " + error.message,
      "error"
    );
  }
}

$("#addBorrowingModal").on("show.bs.modal", () => {
  populateBooksDropdown();
  populateMembersDropdown();
});
