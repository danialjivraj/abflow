import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Profile from "../src/pages/Profile";
import axios from "axios";
import { auth } from "../src/firebase";
import { BrowserRouter } from "react-router-dom";
import { NotificationsProvider } from "../src/contexts/NotificationsContext";
import { createBaseTask } from "../_testUtils/createBaseTask";
import { createBaseUser } from "../_testUtils/createBaseUser";

jest.mock("axios");

describe("Profile Page", () => {
  beforeEach(() => {
    const user = createBaseUser();
    auth.currentUser = { uid: user.userId };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render profile data correctly using base tasks and user", async () => {
    const completedTasks = [
      createBaseTask({
        _id: "1",
        title: "Task A1",
        priority: "A1",
        status: "completed",
        points: 5.0,
      }),
      createBaseTask({
        _id: "2",
        title: "Task A2",
        priority: "A2",
        status: "completed",
        points: 4.5,
      }),
      createBaseTask({
        _id: "3",
        title: "Task A3",
        priority: "A3",
        status: "completed",
        points: 4.0,
      }),
      createBaseTask({
        _id: "4",
        title: "Task B1",
        priority: "B1",
        status: "completed",
        points: 3.5,
      }),
      createBaseTask({
        _id: "5",
        title: "Task B2",
        priority: "B2",
        status: "completed",
        points: 3.0,
      }),
      createBaseTask({
        _id: "6",
        title: "Task B3",
        priority: "B3",
        status: "completed",
        points: 2.5,
      }),
      createBaseTask({
        _id: "7",
        title: "Task C1",
        priority: "C1",
        status: "completed",
        points: 2.0,
      }),
      createBaseTask({
        _id: "8",
        title: "Task C2",
        priority: "C2",
        status: "completed",
        points: 1.5,
      }),
      createBaseTask({
        _id: "9",
        title: "Task C3",
        priority: "C3",
        status: "completed",
        points: 1.0,
      }),
      createBaseTask({
        _id: "10",
        title: "Task D",
        priority: "D",
        status: "completed",
        points: 0.5,
      }),
      createBaseTask({
        _id: "11",
        title: "Task E",
        priority: "E",
        status: "completed",
        points: 0.0,
      }),
      createBaseTask({
        _id: "12",
        title: "Task A1",
        priority: "A1",
        status: "completed",
        points: 5.0,
      }),
      createBaseTask({
        _id: "13",
        title: "Task B1",
        priority: "B1",
        status: "completed",
        points: 3.5,
      }),
    ];
    // Pending task that should not be counted
    const pendingTask = createBaseTask({
      _id: "14",
      title: "Pending Task",
      priority: "A1",
      status: "pending",
      points: 5.0,
    });

    const aggregatedProfile = completedTasks.reduce(
      (acc, task) => ({
        points: acc.points + task.points,
        tasksCompleted: acc.tasksCompleted + 1,
      }),
      { points: 0, tasksCompleted: 0 }
    );

    axios.get.mockResolvedValueOnce({
      data: aggregatedProfile,
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>
    );

    const profileHeading = await screen.findByRole("heading", { name: "Profile" });
    expect(profileHeading).toBeInTheDocument();
    expect(await screen.findByText("36")).toBeInTheDocument();
    expect(await screen.findByText("13")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching profile data:",
        expect.any(Error)
      );
    });
    consoleErrorSpy.mockRestore();
  });

  it("should not fetch profile data if no user is logged in", async () => {
    auth.currentUser = null;
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(2);
  });

  it("should call axios.get with correct userId", async () => {
    axios.get.mockResolvedValueOnce({
      data: { points: 10, tasksCompleted: 1 },
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/user1"
      );
    });
  });

  it("should render decimal profile points correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: { points: 23.5, tasksCompleted: 5 },
    });
  
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>
    );
  
    const profileHeading = await screen.findByRole("heading", {
      name: "Profile",
    });
    expect(profileHeading).toBeInTheDocument();
    expect(await screen.findByText("23.5")).toBeInTheDocument();
    expect(await screen.findByText("5")).toBeInTheDocument();
  });
});
