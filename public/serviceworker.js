self.addEventListener("fetch", function(event) {
    if (event.request.url.includes("bootstrap.min.css")) {
    console.log("Fetch request for:", event.request.url);
    event.respondWith(
    new Response(
    ".hotel-slogan {background: red!important;} nav {display:none}",
    { headers: { "Content-Type": "text/css" }}
    )
    );
    }
    });