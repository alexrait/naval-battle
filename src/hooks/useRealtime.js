import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

export const useRealtime = (userId, onInvite) => {
  const [pusher, setPusher] = useState(null);

  const savedCallback = useRef(onInvite);

  useEffect(() => {
    savedCallback.current = onInvite;
  }, [onInvite]);

  useEffect(() => {
    if (!userId) return;

    const pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER
    });

    const channel = pusherInstance.subscribe(`user-${userId}`);
    
    channel.bind("incoming-invite", (data) => {
      if (savedCallback.current) savedCallback.current({ ...data, type: "incoming-invite" });
    });

    channel.bind("invite-response", (data) => {
      if (savedCallback.current) savedCallback.current({ ...data, type: "invite-response" });
    });

    setPusher(pusherInstance);

    return () => {
      pusherInstance.unsubscribe(`user-${userId}`);
      pusherInstance.disconnect();
    };
  }, [userId]);

  return pusher;
};
