"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";
import { MutatingDots } from "react-loader-spinner";

type User = any;

const Redirect = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.auth.getUser();

        if (data.user !== null) {
          setUser(data.user);
          router.push("/");
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

  if (!user) {
    return <>{children}</>;
  }
};

export default Redirect;
