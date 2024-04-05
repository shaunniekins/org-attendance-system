"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";
import { MutatingDots } from "react-loader-spinner";
import { Session } from "@supabase/supabase-js";

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error && error.status === 401) {
          console.error("No session.");
          router.push("/signin");
        } else if (error) {
          console.error("Error fetching user:", error.message);
        } else if (data.session != null) {
          setSession(data.session);
        }
      } catch (error) {
        console.error("An unexpected error occurred:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="z-50 flex w-screen h-[100svh] justify-center items-center bg-opacity-50 bg-black inset-0 fixed overflow-hidden">
        <MutatingDots
          height="100"
          width="100"
          color="#8667F2"
          secondaryColor="#E0E7FF"
          radius="12.5"
          ariaLabel="mutating-dots-loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div>
    );
  }

  if (!session) {
    router.push("/signin");
  }

  return <>{children}</>;
};

export default Protected;
