// function uuid(): string {
//     return crypto.randomUUID().replaceAll("-", "");
// }

type user = {
    id: string;
    socket: WebSocket;
};

function rand(arr: Array<user>): number {
    return (Math.random() * arr.length) | 0;
}

const waitingList: user[] = [];
const rooms: Array<user>[] = [];

Deno.serve(async function (request: Request): Promise<Response> {
    if (request.headers.get("upgrade") === "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(request);

        socket.addEventListener("open", () => {
            waitingList.forEach((user) => {
                console.log("sent");
                user.socket.send(JSON.stringify({ myid: user.id }));
            });
        });

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
            if (data.myid) {
                waitingList.push({
                    id: data.myid,
                    socket,
                });
            }

            const l = waitingList.length;
            if (l > 1) {
                const i1 = rand(waitingList);
                const i2 = rand(waitingList);
                const u1 = waitingList[i1];
                const u2 = waitingList[i2];
                rooms.push([u1, u2]);
                u1.socket.send(JSON.stringify({ youid: u2.id }));
                // u2.socket.send(JSON.stringify({ youid: u1.id }));
                waitingList.splice(i1, 1);
                waitingList.splice(i2, 1);
            }
        };

        socket.addEventListener("close", () => {
            for (let i = 0; i < waitingList.length; ++i) {
                if (waitingList[i].socket === socket) waitingList.splice(i, 1);
            }

            for (let i = 0; i < rooms.length; ++i) {
                if (rooms[i][0].socket === socket) {
                    waitingList.push(rooms[i][1]);
                    rooms.splice(i, 1);
                } else if (rooms[i][1].socket === socket) {
                    waitingList.push(rooms[i][1]);
                    rooms.splice(i, 1);
                }
            }
            console.log("closed");
        });

        return response;
    } else if (new URLPattern({ pathname: "/" }).exec(request.url)) {
        return new Response(
            await Deno.readTextFile("./client/index.html").catch((o) => o),
            {
                status: 200,
                headers: { "content-type": "text/html" },
            }
        );
    }

    return new Response("Not found! go to home", { status: 404 });
});
