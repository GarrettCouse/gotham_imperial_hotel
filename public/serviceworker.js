importScripts("/js/reservations-store.js");
importScripts("/js/vendor/progressive-ui-kitt/progressive-ui-kitt-sw-helper.js");
var CACHE_NAME = "gih-cache-v4";
var CACHED_URLS = [
// Our HTML
"/index.html",
// Stylesheets
"/css/gih.css",
"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
"https://fonts.googleapis.com/css?family=Lato:300,600,900",
// JavaScript
"https://code.jquery.com/jquery-3.0.0.min.js",
"/js/app.js",
// Images
"/img/logo.png",
"/img/logo-header.png",
"/img/event-calendar-link.jpg",
"/img/switch.png",
"/img/logo-top-background.png",
"/img/jumbo-background.jpg",
"/img/reservation-gih.jpg",
"/img/about-hotel-spa.jpg",
"/img/about-hotel-luxury.jpg",
"/my-account.html",
"/js/my-account.js",
"/reservations.json",
"/js/reservations-store.js",
"/js/vendor/progressive-ui-kitt/themes/flat.css",
"/js/vendor/progressive-ui-kitt/progressive-ui-kitt.js"

];
self.addEventListener("install", function(event) {
event.waitUntil(
caches.open(CACHE_NAME).then(function(cache) {
return cache.addAll(CACHED_URLS);
})
);
});
self.addEventListener("fetch", function(event) {
event.respondWith(
fetch(event.request).catch(function() {
return caches.match(event.request).then(function(response) {
if (response) {
return response;
} else if (requestURL.pathname === "/events.json") {
    event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
    return fetch(event.request).then(function(networkResponse) {
    cache.put(event.request, networkResponse.clone());
    return networkResponse;
    }).catch(function() {
    ProgressiveKITT.addAlert(
    "You are currently offline."+
    "The content of this page may be out of date."
    );
    return caches.match(event.request);
    });
    })
    );
    }
});
})
);
});
self.addEventListener("activate", function(event) {
event.waitUntil(
caches.keys().then(function(cacheNames) {
return Promise.all(
cacheNames.map(function(cacheName) {
if (CACHE_NAME !== cacheName && cacheName.startsWith("gih-cache")) {
return caches.delete(cacheName);
}
})
);
})
);
});

var createReservationUrl = function(reservationDetails) {
    var reservationUrl = new URL("http://localhost:8443/make-reservation");
    Object.keys(reservationDetails).forEach(function(key) {
    reservationUrl.searchParams.append(key, reservationDetails[key]);
    });
    return reservationUrl;
    };
    var postReservationDetails = function(reservation) {
        self.clients.matchAll({ includeUncontrolled: true }).then(function(clients) {
        clients.forEach(function(client) {
        client.postMessage(
        {action: "update-reservation", reservation: reservation}
        );
        });
        });
        };
    var syncReservations = function() {
        return getReservations("idx_status", "Sending").then(function(reservations) {
        return Promise.all(
        reservations.map(function(reservation) {
        var reservationUrl = createReservationUrl(reservation);
        return fetch(reservationUrl).then(function(response) {
        return response.json();
        }).then(function(newReservation) {
        return updateInObjectStore(
        "reservations",
        newReservation.id,
        newReservation
        ).then(function() {
        postReservationDetails(newReservation);
        });
        });
        })
        );
        });
        };
    self.addEventListener("sync", function(event) {
    if (event.tag === "sync-reservations") {event.waitUntil(syncReservations());
    }
    });


    self.addEventListener("message", function(event) {
        var data = event.data;
        if (data.action === "logout") {
        self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
        if (client.url.includes("/my-account")) {
        client.postMessage(
        {action: "navigate", url: "/"}
        );
        }
        });
        });
        }
        });


        self.addEventListener("push", function(event) {
            var data = event.data.json();
            if (data.type === "reservation-confirmation") {
            var reservation = data.reservation;
            event.waitUntil(
            updateInObjectStore(
            "reservations",
            reservation.id,
            reservation)
            .then(function() {
            return self.registration.showNotification("Reservation Confirmed", {
            body:
            "Reservation for "+reservation.arrivalDate+" has been confirmed.",
            icon: "/img/reservation-gih.jpg",
            badge: "/img/icon-hotel.png",
            tag: "reservation-confirmation-"+reservation.id,
            actions: [
            {
            action: "details",
            title: "Show reservations",
            icon: "/img/icon-cal.png"
            }, {
            action: "confirm",
            title: "OK",
            icon: "/img/icon-confirm.png"
            },
            ],
            vibrate:
            [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
            });
            })
            );
            }
            });

            self.addEventListener("notificationclick", function(event) {
                event.notification.close();
                if (event.action === "details") {event.waitUntil(
                self.clients.matchAll().then(function(activeClients) {
                if (activeClients.length > 0) {
                activeClients[0].navigate("http://localhost:8443/my-account");
                } else {
                self.clients.openWindow("http://localhost:8443/my-account");
                }
                })
                );
                }
                });