import { io } from 'socket.io-client'

const url = import.meta.env.VITE_SERVER_URL || window.location.origin

export const socket = io(url, {
  transports: ['websocket'],
  autoConnect: true,
})

