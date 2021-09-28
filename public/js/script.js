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
    // fetch all data of todo
    await fetch("http://localhost:3000/list-todos")
      .then(async (allToDo) => {
        return await allToDo.json();
      })
      .then((datas) => {
        datas.results.forEach((el) => {
          const todoEl = document.createElement("div");
          todoEl.classList.add("item");
          const taskId = el.id;
          const text = el.todo;

          todoEl.setAttribute("taskId", taskId);
          todoEl.innerHTML = `<span class="txt" onClick="startEditToDo(this, ${taskId})">${text}</span><i class="trash fa fa-trash" onClick="deleteToDo(this.parentNode, ${taskId})"></i><i class="icon fa fa-bars"></i>`;
          // changePostion() after dragend
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
  let prevElIndexNumber;
  let nextElIndexNumber;

  try {
    // Get index_number if there is a task on top of the dragged and dropped task
    // if not, undefined
    if (currEl.previousSibling !== null) {
      const prevElId = currEl.previousSibling.getAttribute("taskId");

      await fetch("http://localhost:3000/read-todos/" + prevElId)
        .then(async (data) => {
          return await data.json();
        })
        .then((json) => {
          prevElIndexNumber = json.results[0].index_number;
        });
    }

    // Get index_number if there is a task under the drag & drop task
    // if not, undefined
    if (currEl.nextSibling != null) {
      const nextElId = currEl.nextSibling.getAttribute("taskId");
      await fetch("http://localhost:3000/read-todos/" + nextElId)
        .then(async (data) => {
          return await data.json();
        })
        .then((json) => {
          nextElIndexNumber = json.results[0].index_number;
        });
    }

    // HTTP Request
    const updateUrl = "http://localhost:3000/order-todos/" + currElId;

    await fetch(updateUrl, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ prevElIndexNumber, nextElIndexNumber }),
    });
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

async function finishEditToDo(button, input, id) {
  const newValue = input.value;
  const newToDo = input.parentNode;
  newToDo.innerHTML = `<span class='txt' onclick='startEditToDo(this)'>${newValue}</span><i class="trash fa fa-trash" onClick="deleteToDo(this.parentNode, ${id})"></i><i class="icon fa fa-bars"></i>`;
  button.remove();
  input.remove();

  const updateUrl = "http://localhost:3000/edit-todos/" + id;
  await fetch(updateUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ newValue }),
  });
}

// function of deleting todo
async function deleteToDo(node, id) {
  node.remove();

  const deleteUrl = "http://localhost:3000/delete-todos/" + id;

  await fetch(deleteUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
  });
}
