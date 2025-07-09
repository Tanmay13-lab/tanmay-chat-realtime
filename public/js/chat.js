const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageInput = document.querySelector('#message');
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Typing Indicator Element
const $typingIndicator = document.createElement('p');
$typingIndicator.id = 'typing-indicator';
document.querySelector('.chat__main').appendChild($typingIndicator);

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#locmessage-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Auto Scroll
const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// Incoming Messages
socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (url) => {
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room: room,
    users: users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

// Send Message
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  const message = $messageFormInput.value;

  if (message === "") {
    $messageFormButton.removeAttribute("disabled");
    return;
  }

  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
  });
});

// Send Location
document.querySelector("#send-location").addEventListener("click", (e) => {
  e.preventDefault();
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  navigator.permissions.query({ name: "geolocation" }).then((res) => {
    if (res.state === "denied") {
      return alert("Please allow permission to send location!");
    }
  });

  navigator.geolocation.getCurrentPosition((position) => {
    $sendLocationButton.setAttribute("disabled", "disabled");

    socket.emit(
      "sendLocation",
      {
        Latitude: position.coords.latitude,
        Longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
      }
    );
  });
});

// Emit Typing When Input Happens
$messageInput.addEventListener('input', () => {
  socket.emit('typing');
});

// Join Room
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

// Typing Indicator Listeners
socket.on("showTyping", (msg) => {
  $typingIndicator.innerText = msg;
});

socket.on("hideTyping", () => {
  $typingIndicator.innerText = "";
});
