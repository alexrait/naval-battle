import { useEffect, useState } from "react";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

export const useRealtime = (userId, onInvite) => {
  const [pusher, setPusher] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER
    });

    const channel = pusherInstance.subscribe(`user-${userId}`);
    
    channel.bind("incoming-invite", (data) => {
      if (onInvite) onInvite(data);
    });

    setPusher(pusherInstance);

    return () => {
      pusherInstance.unsubscribe(`user-${userId}`);
      pusherInstance.disconnect();
    };
  }, [userId]);

  return pusher;
};
