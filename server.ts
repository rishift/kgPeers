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
const rooms = [];

Deno.serve(
    { port: 8080 },
    async function (request: Request): Promise<Response> {
        if (request.headers.get("upgrade") === "websocket") {
            const { socket, response } = Deno.upgradeWebSocket(request);

            socket.addEventListener("open", () => {
                // const id = uuid();
                // console.log(id);
                // socket.send(JSON.stringify({ myid: id }));
                // waitingList[id] = socket;
                // const l = Object.keys(waitingList).length;
                // if (l > 2) {
                //     let id1 = getrand(waitingList);
                //     let id2 = getrand(waitingList);
                //     rooms.push([
                //         {
                //             [id1]: waitingList[id1],
                //             [id2]: waitingList[id2],
                //         },
                //     ]);
                //     waitingList[id1].send(JSON.stringify({ youid: id2 }));
                //     waitingList[id2].send(JSON.stringify({ youid: id1 }));
                //     delete waitingList[id1], waitingList[id2];
                //     console.log("shifted to room");
                //     console.log(Object.keys(waitingList).length);
                // }4
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
                if (l > 2) {
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
    }
);
