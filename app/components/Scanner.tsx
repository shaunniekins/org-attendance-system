"use client";

// import { Scanner } from "@yudiel/react-qr-scanner";
import { CSSProperties, useEffect, useState } from "react";
import { Type, Grid, Sunrise, Sunset, Hash, Settings } from "react-feather";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import dynamic from "next/dynamic";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

const ScannerComponent = () => {
  const [mainThemeColor, setMainThemeColor] = useState("sky");
  const [result, setResult] = useState("");
  // const [isQRCodeDetected, setIsQRCodeDetected] = useState(false);
  const [displayScanResult, setDisplayScanResult] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState("");

  const [isAttendanceEnable, setIsAttendanceEnable] = useState(true);
  const [isTimeIn, setIsTimeIn] = useState(true);
  const [session, setSession] = useState(1);

  const [idNumber, setIdNumber] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (displayScanResult) {
      let timer = setTimeout(() => {
        setDisplayScanResult(false);
      }, 3500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [displayScanResult]);

  const getLocalDateTimeAndDate = () => {
    const now = new Date();
    const timezoneOffsetInHours = now.getTimezoneOffset() / 60;
    now.setHours(now.getHours() - timezoneOffsetInHours);
    const localDateTime = now.toISOString().slice(0, 19).replace("T", " ");
    const localDate = now.toISOString().slice(0, 10);
    return { localDateTime, localDate };
  };

  const handleScanResult = async (idNumber: string) => {
    if (!idNumber) return;

    setResult(idNumber);

    const { localDateTime, localDate } = getLocalDateTimeAndDate();

    try {
      // Check if the user has already clocked in/out for the same day and session
      const {
        data: existingData,
        error: checkError,
        count,
      } = await supabase
        .from("attendance_list")
        .select("*", { count: "exact" })
        .eq("id_number", idNumber)
        .gte("time_in", `${localDate}T00:00:00Z`)
        .lte("time_in", `${localDate}T23:59:59Z`)
        .eq("session", session);

      if (checkError) {
        console.error("Error checking attendance data:", checkError);
        return;
      }
      // console.log("count:", count);
      // console.log("existingData:", existingData);
      if (isTimeIn) {
        if (count === 0) {
          // No existing record, insert a new one
          const { error: insertError } = await supabase
            .from("attendance_list")
            .insert([
              {
                id_number: idNumber,
                time_in: localDateTime,
                session,
              },
            ]);

          if (insertError) {
            console.error("Error inserting attendance data:", insertError);
            return;
          }

          // console.log("Attendance record inserted successfully.");
          // setMessagePrompt("Attendance record inserted successfully.");
          // setMessagePrompt("Successfully Time-In!");
          alert("Successfully Time-In!");
        } else if (count === 1) {
          // Existing record, prompt the user
          alert("Already Timed In!");
          // setMessagePrompt(
          //   "You have already clocked in for the day. You cannot clock in again."
          // );
        } else {
          // Multiple records found, handle the case accordingly
          console.error(
            "Multiple attendance records found for the same day and session."
          );
        }
      } else {
        // Time out
        if (count === 1) {
          // Existing record, check if the user has already clocked out
          if (existingData[0].time_out) {
            // User has already clocked out
            // alert("You have already clocked out for the day.");
            alert("Already Timed Out!");
            // setMessagePrompt("You have already clocked out for the day.");
            // setMessagePrompt("Already Timed-Out!");

            return;
          }

          // User has not clocked out yet, update the time_out
          const { error: updateError } = await supabase
            .from("attendance_list")
            .update({
              time_out: localDateTime,
            })
            .eq("id_number", idNumber)
            .gte("time_in", `${localDate}T00:00:00Z`)
            .lte("time_in", `${localDate}T23:59:59Z`)
            .eq("session", session);

          if (updateError) {
            console.error("Error updating attendance data:", updateError);
            return;
          }

          console.log("Attendance record updated successfully.");
          // setMessagePrompt("Attendance record updated successfully.");
        } else if (count === 0) {
          // No existing record, prompt the user
          // alert("You have not clocked in yet. You cannot clock out.");
          alert("Not yet Timed In!");
          // setMessagePrompt(
          //   "You have not clocked in yet. You cannot clock out."
          // );
        } else {
          // Multiple records found, handle the case accordingly
          console.error(
            "Multiple attendance records found for the same day and session."
          );
        }
      }
      setDisplayScanResult(true);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  // interface IScannerStyles {
  //   finderBorder: number;
  //   container?: CSSProperties;
  //   video?: CSSProperties;
  // }

  const handleScannerClick = () => {
    const inputIdNumber = prompt(
      "Please enter your ID number: (do not include dashes)"
    );
    if (inputIdNumber !== null) {
      const numericValue = inputIdNumber.replace(/[^0-9]/g, "");
      if (numericValue.length <= 8) {
        let formattedValue = numericValue;
        if (numericValue.length > 3) {
          formattedValue = `${numericValue.slice(0, 3)}-${numericValue.slice(
            3
          )}`;
        }
        console.log(formattedValue);
        // setIdNumber(formattedValue);
        handleScanResult(formattedValue);
      }
    }
  };

  //  Local Storage Time-In/Time-Out
  useEffect(() => {
    const storedAttendanceOption = localStorage.getItem("attendanceOption");

    setIsTimeIn(
      storedAttendanceOption ? storedAttendanceOption === "true" : true
    );
  }, []);

  const handleAttendanceOptionChange = () => {
    setIsTimeIn(!isTimeIn);
    const value = !isTimeIn;
    localStorage.setItem("attendanceOption", JSON.stringify(value));
  };

  return (
    <>
      <div className="flex justify-center items-center h-[100svh] select-none overflow-y-hidden bg-black">
        <div
          className={`${
            isAttendanceEnable ? "justify-between" : "justify-end"
          } container mx-auto z-30 absolute top-5 w-full px-10 flex `}>
          {isAttendanceEnable && (
            <div className=" z-50 text-white self-center space-x-2 flex">
              {/* <h3 className="bg-sky-600 rounded-full px-4 py-1">
                {session === 1 ? "AM" : "PM"}
              </h3> */}
              <button
                className={`
                  bg-sky-600 rounded-full px-4 py-1`}
                onClick={handleAttendanceOptionChange}>
                {isTimeIn ? "IN" : "OUT"}
              </button>
            </div>
          )}

          <div className="space-x-2">
            {isAttendanceEnable && (
              <button
                className="bg-sky-600 text-white rounded-full px-4 py-2"
                onClick={handleScannerClick}>
                <Hash />
              </button>
            )}
            {/* <button
              className="bg-sky-600 text-white rounded-full px-4 py-2 text-xs"
              onClick={() => router.push("/attendance")}>
              <Grid />
            </button>
            <button
              className="bg-sky-600 text-white rounded-full px-4 py-2 text-xs"
              onClick={() => router.push("/settings")}>
              <Settings />
            </button> */}
          </div>
        </div>
        <Scanner
          onResult={(result: string) => handleScanResult(result)}
          onError={(error) => console.log(error?.message)}
          enabled={isAttendanceEnable}
          options={{
            delayBetweenScanAttempts: 1000,
          }}
          styles={{
            // finderBorder: 0,
            container: {
              // width: "100%",
              // height: "100%",
              // background: mainThemeColor,
            },
            video: {
              // objectFit: "cover",
              width: "100%",
              height: "100%",
            },
          }}
        />
        {!isAttendanceEnable && (
          <div className="flex flex-col items-center justify-center absolute  w-full h-full top-0 left-0 z-5 text-3xl text-white">
            <h4 className="flex flex-col text-center">
              Attendance
              <span className="font-bold text-red-600">DEACTIVATED!</span>{" "}
            </h4>
          </div>
        )}

        {/* {displayScanResult && (
          <div className="z-50 absolute bottom-16 text-center text-white shadow-xl space-y-5">
            <p className="text-xs">
              <span className="text-sm">{result}</span> <br />
              {messagePrompt}
            </p>
          </div>
        )} */}

        <p
          className={`z-50 absolute bottom-3 bg-[${mainThemeColor}]-600 rounded-full px-2 py-1 text-xs text-white`}>
          Created by <span className=" font-bold">Shaun Niel Ochavo</span>
        </p>
      </div>
    </>
  );
};

export default ScannerComponent;
