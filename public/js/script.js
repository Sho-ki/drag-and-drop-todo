// Sortable.js Options
let dragArea = document.querySelector(".wrapper");
new Sortable(dragArea, {
  animation: 200,
  handle: ".icon",
});

// fetch api and display all stored datas
const wrapper = document.getElementById("wrapper");
window.onload = async () => {
  try {
    await fetch("http://localhost:3000/list/apis")
      .then((allToDo) => {
        return allToDo.json();
      })
      .then((datas) => {
        datas.results.forEach((data) => {
          const todoEl = document.createElement("div");
          todoEl.classList.add("item");
          const taskId = data.id;
          const text = data.todo;

          todoEl.setAttribute("taskId", taskId);
          todoEl.innerHTML = `<span class="txt" onClick="startEditToDo(this, ${taskId})">${text}</span><i class="trash fa fa-trash" onClick="deleteToDo(this.parentNode, ${taskId})"></i><i class="icon fa fa-bars"></i>`;
          todoEl.addEventListener("dragend", () => {
            changePosition(todoEl, taskId);
          });
          wrapper.appendChild(todoEl);
        });
      });
  } catch (e) {
    console.log(e);
  }
};

async function changePosition(currEl, currElId) {
  let prevElIndex_Number;
  let nextElIndex_Number;

  try {
    // If the element moved is not on the top, put the moved element index_number into prevElIndex_Number
    if (currEl.previousSibling !== null) {
      const prevElId = currEl.previousSibling.getAttribute("taskId");

      await fetch("http://localhost:3000/read/apis/" + prevElId)
        .then((data) => {
          return data.json();
        })
        .then((json) => {
          prevElIndex_Number = json.results[0].index_number;
        });
    }

    // If the element moved is not on the bottom, put the moved element index_number into nextElIndex_Number
    if (currEl.nextSibling != null) {
      const nextElId = currEl.nextSibling.getAttribute("taskId");
      await fetch("http://localhost:3000/read/apis/" + nextElId)
        .then((data) => {
          return data.json();
        })
        .then((json) => {
          nextElIndex_Number = json.results[0].index_number;
        });
    }
    // If the element moved is on the top, there is a no previous element, therefore, prevElIndex_Number is undefined
    // In the same way, nextElIndex_Number is undefined if no next element is found.

    const updateUrl = "http://localhost:3000/order/apis/" + currElId;

    var xhr = new XMLHttpRequest();
    xhr.open("POST", updateUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(
      JSON.stringify({
        prevElIndex_Number,
        nextElIndex_Number,
      })
    );
  } catch (e) {
    console.log(e);
  }
}

// function of editting todo
function startEditToDo(txtTag, id) {
  const input = document.createElement("input");
  input.value = txtTag.innerText;

  const okButton = document.createElement("button");
  okButton.innerText = "OK";

  okButton.setAttribute(
    "onClick",
    `finishEditToDo(this, this.previousSibling, ${id})`
  );

  txtTag.parentNode.insertBefore(okButton, txtTag.nextSibling);

  txtTag.replaceWith(input);
}

function finishEditToDo(button, input, id) {
  const newValue = input.value;
  const newToDo = input.parentNode;
  newToDo.innerHTML = `<span class='txt' onclick='startEditToDo(this)'>${newValue}</span><i class="trash fa fa-trash" onClick="deleteToDo(this.parentNode, ${id})"></i><i class="icon fa fa-bars"></i>`;
  button.remove();
  input.remove();

  const updateUrl = "http://localhost:3000/edit/apis/" + id;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", updateUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(
    JSON.stringify({
      newValue,
    })
  );
}

// function of deleting todo
function deleteToDo(node, id) {
  node.remove();

  const deleteUrl = "http://localhost:3000/delete/apis/" + id;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", deleteUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send();
}
