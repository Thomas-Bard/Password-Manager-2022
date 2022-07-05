const socket = io();

let current_passwords = [];
let hasRecievedPasswords = false;



function AddPassword() {
    console.log("AddPassword");
    const password_name = document.getElementById("add_password_name");
    const password_login = document.getElementById("add_password_login");
    const password_password = document.getElementById("add_password_password");

    const password = {
        name: password_name.value,
        email: password_login.value,
        password: password_password.value
    };
    socket.emit("add_password", password);
    appendPassword(password, current_passwords.length);
    password_name.value = "";
    password_login.value = "";
    password_password.value = "";
}

function passwordCopy(emitter) {
    const password_number = emitter.target.id.split("_")[2];
    const password_password = document.getElementById(`password_password_${password_number}`);
    console.log(password_password);
    navigator.clipboard.writeText(password_password.innerText);
}

function passwordDelete(emitter) {
    const password_number = emitter.target.id.split("_")[2];
    RemovePassword(password_number);
}

function appendPassword(password, password_number) {
    const password_list = document.getElementById("passwords_list");
    const password_container = document.createElement("div");
    password_container.classList.add("password_container");
    password_container.classList.add("row");
    password_container.id = `password_${password_number}`;
    const password_name = document.createElement("div");
    password_name.classList.add("password_content");
    password_name.id = `password_name_${password_number}`;
    password_name.innerText = password.name;
    const password_login = document.createElement("div");
    password_login.classList.add("password_content");
    password_login.id = `password_login_${password_number}`;
    password_login.innerText = password.email;
    const password_password = document.createElement("div");
    password_password.classList.add("password_content");
    password_password.id = `password_password_${password_number}`;
    password_password.innerText = password.password;
    const password_buttons = document.createElement("div");
    password_buttons.classList.add("password_content");
    const password_clipboard = document.createElement("button");
    password_clipboard.classList.add("password_button");
    password_clipboard.classList.add("password_button_clipboard");
    password_clipboard.id = `password_clipboard_${password_number}`;
    password_clipboard.innerText = "C";
    password_clipboard.addEventListener("click", passwordCopy);
    const password_delete = document.createElement("button");
    password_delete.classList.add("password_button");
    password_delete.classList.add("password_button_delete");
    password_delete.id = `password_delete_${password_number}`;
    password_delete.innerText = "X";
    password_delete.addEventListener("click", passwordDelete);
    password_buttons.appendChild(password_clipboard);
    password_buttons.appendChild(password_delete);
    password_container.appendChild(password_name);
    password_container.appendChild(password_login);
    password_container.appendChild(password_password);
    password_container.appendChild(password_buttons);
    password_list.appendChild(password_container);
}

function RemovePassword(password_number) {
    const password_container = document.getElementById(`password_${password_number}`);
    const password_name = document.getElementById(`password_name_${password_number}`);
    socket.emit("remove_password", password_name.innerText);
    password_container.remove();
}

function openAddModal() {
    console.log("openAddModal");
    setTimeout(() => {
        const modal = document.getElementById("modal_add_password");
        modal.style.display = "block";
    }, 100);
}

function closeAddModal() {
    const modal = document.getElementById("modal_add_password");
    modal.style.display = "none";
}

window.onload = () => {
    const add_password = document.getElementById("add_password_confirm");
    console.log("window.onload");
    const modal_button = document.getElementById("add_password");
    modal_button.addEventListener("click", openAddModal);
    const add_password_confirm = document.getElementById("add_password_confirm");
    add_password_confirm.addEventListener("click", closeAddModal);
    window.onclick = (event) => {
        if (event.target.id == "modal_add_password") {
            closeAddModal();
        }
    }
    add_password.addEventListener("click", AddPassword);
    socket.on("passwords", (passwords) => {
        current_passwords = passwords;
        let password_list = document.getElementById("passwords_list");
        password_list.innerHTML = "";
        for (let i = 0; i < current_passwords.length; i++) {
            appendPassword(current_passwords[i], i);
        } 
    });

}