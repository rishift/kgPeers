function random(arr: Array<WebSocket>): WebSocket {
    return arr[Math.floor(Math.random() * arr.length)];
}

function remove(element: WebSocket, arr: Array<WebSocket>) {
    arr.splice(arr.indexOf(element), 1);
}

const waitingRoom: Array<WebSocket> = [];
const rooms: Array<Array<WebSocket>> = [];

// const waitingRoom = new Proxy(waitingRoom, {
//     set: function (target, property, value, receiver) {
//         signal();

//         target[property] = value;
//         return true;
//     },
// });

function signal() {

    
    console.log(waitingRoom, "length: ", waitingRoom.length);

    if (waitingRoom.length > 1) {
        const user1 = random(waitingRoom);
        remove(user1, waitingRoom);
        const user2 = random(waitingRoom);
        remove(user2, waitingRoom);

        
    console.log(waitingRoom, "length after del: ", waitingRoom.length);

        // try {

        

        user1.send(JSON.stringify({ event: "create" }));
        user1.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);

            if ("event" in data) {
                if (data.event == "offer") {
                    user2.send(event.data);
                    user2.addEventListener("message", (event) => {
                        const data = JSON.parse(event.data);

                        if ("event" in data) {
                            if (data.event == "answer") {
                                user1.send(event.data);

                                // user1.addEventListener("message", (event) => {
                                //     const data = JSON.parse(event.data);

                                //     if ("event" in data) {
                                //         if (data.event == "done") {
                                //             rooms.push([user1, user2]);
                                //             //// TODO: handle when user in room leaves
                                //         }
                                //     }
                                // });
                            }
                        }
                    });
                }
            }
        });
        // } catch {
        //     console.log("error");
        //     waitingRoom.push(user1);
        //     waitingRoom.push(user2);
        // }
    }
}

Deno.serve(async function (request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("upgrade") === "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(request);

        socket.addEventListener("open", () => {
            console.log("socket opened");
        });

        socket.addEventListener("close", () => {
            console.log("socket closed, deleting..");
        });

        socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);

            if ("event" in data) {
                if (data.event == "ready") {
                    waitingRoom.push(socket);
                    signal();
                }
            }
        });

        return response;
    } else if (url.pathname === "/") {
        return new Response(
            await Deno.readTextFile("./client/main.html").catch((o) => o),
            {
                status: 200,
                headers: { "content-type": "text/html" },
            }
        );
    }

    return new Response(
        await Deno.readTextFile("./client" + url.pathname).catch(
            () => "404 not found"
        ),
        { status: 200 }
    );
});
