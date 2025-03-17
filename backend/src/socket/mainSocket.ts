// import { Server } from 'socket.io';
// import { Server as HttpServer } from 'http'
// import roomSocket from './socket.Controller/RoomSocket/roomSocket';

// const setupSockets = (server: HttpServer) => {
//   const io = new Server(server);

//   io.on('connection', (socket) => {
//     console.log(' user connected:', socket.id);
//     roomSocket(io, socket)

//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });
//   });

//   return io;
// };

// export { setupSockets };
