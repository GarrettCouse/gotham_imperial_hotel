$(document).ready(function() {
  $.getJSON("/events.json", renderEvents);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (event) {
      var data = event.data;
      if (data.action === "navigate") {
      window.location.href = data.url;
      } else if (data.action === "update-reservation") {
      updateReservationDisplay(data.reservation);
      }
      });
  $("#logout-button").click(function(event) {
  if (navigator.serviceWorker.controller) {
  event.preventDefault();
  navigator.serviceWorker.controller.postMessage(
  {action: "logout"}
  );
  }
  });
  }
  });




/* ************************************************************ */
/* The code below this point is used to render to the DOM. It   */
/* completely ignores common sense principles as a trade off    */
/* for readability.                                             */
/* You can ignore it, or you can send angry tweets about it to  */
/* @TalAter                                                     */
/* ************************************************************ */

var renderEvents = function(data) {
  data.forEach(function(event) {
    $(
      "<div class=\"col-lg-2 col-md-4 col-sm-6 event-container\"><div class=\"event-card\">"+
      "<div class=\"event-date\">"+event.date+"</div>"+
      "<img src=\""+event.img+"\" alt=\""+event.title+"\" class=\"img-responsive\" />"+
      "<h4>"+event.title+"</h4>"+
      "<p>"+event.description+"</p>"+
      "</div></div>"
    ).insertBefore("#events-container div.calendar-link-container");
  });
};


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", function (event) {
  if (event.data === "events-returned-from-cache") {
  alert(
  "You are currently offline. The content of this page may be out of date"
  );
  }
  });
  }
