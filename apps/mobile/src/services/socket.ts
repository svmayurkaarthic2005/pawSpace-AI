import { io, Socket } from 'socket.io-client';
import * as Keychain from 'react-native-keychain';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

// Strip /api/v1 to get the base socket URL
const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket;

  const credentials = await Keychain.getGenericPassword({
    service: STORAGE_KEYS.ACCESS_TOKEN,
  });
  const token = credentials ? credentials.password : undefined;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason: any) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string): void => {
  socket?.emit('join_room', roomId);
};

export const leaveRoom = (roomId: string): void => {
  socket?.emit('leave_room', roomId);
};
