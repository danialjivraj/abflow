import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../../src/pages/Profile";
import axios from "axios";
import { auth } from "../../src/firebase";
import { BrowserRouter } from "react-router-dom";
import { NotificationsProvider } from "../../src/contexts/NotificationsContext";
import { createBaseTask } from "../../_testUtils/createBaseTask";
import { createBaseUser } from "../../_testUtils/createBaseUser";
import * as profileService from "../../src/services/profileService";

jest.mock("../../src/firebase", () => ({
  auth: {},
  googleProvider: {},
  db: {},
  default: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, cb) => {
    if (auth.currentUser) cb(auth.currentUser);
    return () => {};
  }),
}));

jest.mock("axios");

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Profile Page", () => {
  beforeEach(() => {
    const user = createBaseUser();
    auth.currentUser = { uid: user.userId };
  });

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/dummy");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------
  // UNIT TESTS
  // ---------------------------------------
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
      { points: 0, tasksCompleted: 0 },
    );

    axios.get.mockResolvedValueOnce({
      data: {
        ...aggregatedProfile,
        totalHours: 0,
        profilePicture: "",
        name: "Test User",
      },
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    const profileHeading = await screen.findByRole("heading", {
      name: "Profile",
    });
    expect(profileHeading).toBeInTheDocument();
    expect(
      await screen.findByText(String(aggregatedProfile.points)),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(String(aggregatedProfile.tasksCompleted)),
    ).toBeInTheDocument();
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
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching profile data:",
        expect.any(Error),
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
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("should call axios.get with correct userId", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 10,
        tasksCompleted: 1,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/user1",
      );
    });
  });

  it("should render decimal profile points correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 23.5,
        tasksCompleted: 5,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    expect(await screen.findByText("23.5")).toBeInTheDocument();
    expect(await screen.findByText("5")).toBeInTheDocument();
  });

  // ---------------------------------------
  // INTEGRATION TESTS
  // ---------------------------------------
  it("should allow user to edit their name", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 10,
        tasksCompleted: 1,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });
    axios.put.mockResolvedValueOnce({
      data: { message: "Name updated successfully", name: "New Name" },
    });

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByText("User");

    const heading = container.querySelector(".editable-name");
    userEvent.click(heading);

    const nameInput = await screen.findByPlaceholderText("Enter your name");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.blur(nameInput);

    const tickButton = screen.getByTestId("tick-icon");
    userEvent.click(tickButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/updateName/user1",
        { name: "New Name" },
      );
    });

    await waitFor(() => {
      expect(screen.getByText("New Name")).toBeInTheDocument();
    });
  });

  it("should allow user to upload a profile picture", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });
    const fixedTimestamp = 1695673440987;
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);
    axios.post.mockResolvedValueOnce({
      data: {
        message: "Profile picture updated",
        profilePicture: `/uploads/user1-${fixedTimestamp}.jpg`,
      },
    });

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    userEvent.click(screen.getByAltText("Profile"));
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy image content"], "test.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    userEvent.click(await screen.findByText("Save"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/uploadProfilePicture/user1",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      );
    });

    await waitFor(() => {
      expect(screen.getByAltText("Profile").src).toContain(
        `/uploads/user1-${fixedTimestamp}.jpg`,
      );
    });

    dateNowSpy.mockRestore();
  });

  it("should allow user to remove profile picture", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "http://localhost:5000/uploads/test.jpg",
        name: "User",
      },
    });
    axios.put.mockResolvedValueOnce({
      data: { message: "Profile picture removed", profilePicture: "" },
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    userEvent.click(
      screen.getByRole("button", { name: "Remove profile picture" }),
    );
    userEvent.click(await screen.findByText("Save"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/removeProfilePicture/user1",
      );
    });

    await waitFor(() => {
      expect(screen.getByAltText("Profile").src).toContain(
        "/default-profile-image.png",
      );
    });
  });

  it("should allow user to cancel profile picture changes", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "http://localhost:5000/uploads/test.jpg",
        name: "User",
      },
    });

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    userEvent.click(screen.getByAltText("Profile"));
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy image content"], "newtest.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    userEvent.click(screen.getByText("Cancel"));

    expect(axios.post).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByAltText("Profile").src).toContain("/uploads/test.jpg");
    });
  });

  it("should update profilePicture URL correctly after saving new image", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });

    const fixedTimestamp = 1695673999999;
    jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);

    const expectedPath = `/uploads/user1-${fixedTimestamp}.jpg`;

    axios.post.mockResolvedValueOnce({
      data: {
        message: "Profile picture updated",
        profilePicture: expectedPath,
      },
    });

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    const profileImg = screen.getByAltText("Profile");
    userEvent.click(profileImg);

    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy"], "pic.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const saveButton = await screen.findByText("Save");
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    await waitFor(() => {
      const updatedImg = screen.getByAltText("Profile");
      expect(updatedImg.src).toContain(expectedPath);
    });
  });

  it("should remain the same profilePicture URL after cancelling new image", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });

    const fixedTimestamp = 1695673999999;
    jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);

    const expectedPath = `/uploads/user1-${fixedTimestamp}.jpg`;

    axios.post.mockResolvedValueOnce({
      data: {
        message: "Profile picture updated",
        profilePicture: expectedPath,
      },
    });

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    const profileImg = screen.getByAltText("Profile");
    userEvent.click(profileImg);

    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy"], "pic.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const cancelButton = await screen.findByText("Cancel");
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      const updatedImg = screen.getByAltText("Profile");
      expect(updatedImg.src).toContain("");
      expect(updatedImg.src).not.toContain(expectedPath);
    });
  });

  describe("Number formatting for profile stats", () => {
    const renderProfile = async (data) => {
      axios.get.mockResolvedValueOnce({
        data: {
          profilePicture: "",
          name: "User",
          ...data,
        },
      });

      render(
        <BrowserRouter>
          <NotificationsProvider>
            <Profile />
          </NotificationsProvider>
        </BrowserRouter>,
      );
    };

    const checkStat = async (label, shortValue, fullValue) => {
      const stat = await screen.findByText(shortValue);
      expect(stat).toBeInTheDocument();
      expect(stat).toHaveAttribute("title", fullValue.toString());
      expect(screen.getByText(label)).toBeInTheDocument();
    };

    it("formats all fields with no suffix (<1,000)", async () => {
      await renderProfile({
        points: 500,
        tasksCompleted: 999,
        totalHours: 320,
      });

      await checkStat("Points", "500", 500);
      await checkStat("Tasks Completed", "999", 999);
      await checkStat("Hours Spent", "320", 320);
    });

    it("formats all fields with 'k' suffix (1,000 - 999,999)", async () => {
      await renderProfile({
        points: 1500,
        tasksCompleted: 999999,
        totalHours: 1001,
      });

      await checkStat("Points", "1.5k", 1500);
      await checkStat("Tasks Completed", "1000.0k", 999999);
      await checkStat("Hours Spent", "1.0k", 1001);
    });

    it("formats all fields with 'M' suffix (≥1,000,000)", async () => {
      await renderProfile({
        points: 1234567,
        tasksCompleted: 2500000,
        totalHours: 1000000,
      });

      await checkStat("Points", "1.2M", 1234567);
      await checkStat("Tasks Completed", "2.5M", 2500000);
      await checkStat("Hours Spent", "1.0M", 1000000);
    });
  });

  it("should allow user to edit their name and show a success toast", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 10,
        tasksCompleted: 1,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });
    axios.put.mockResolvedValueOnce({
      data: { message: "Name updated successfully", name: "New Name" },
    });
    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByText("User");

    const heading = container.querySelector(".editable-name");
    userEvent.click(heading);

    const nameInput = await screen.findByPlaceholderText("Enter your name");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.blur(nameInput);

    const tickButton = screen.getByTestId("tick-icon");
    userEvent.click(tickButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/updateName/user1",
        { name: "New Name" },
      );
    });

    await waitFor(() => {
      expect(screen.getByText("New Name")).toBeInTheDocument();
    });

    const { toast } = require("react-toastify");
    expect(toast.success).toHaveBeenCalledWith("Name saved!");
  });

  it("should allow user to update their name by pressing Enter", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 10,
        tasksCompleted: 1,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });
    axios.put.mockResolvedValueOnce({
      data: {
        message: "Name updated successfully",
        name: "Enter Updated Name",
      },
    });

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByText("User");

    const heading = screen.getByText("User");
    userEvent.click(heading);

    const nameInput = await screen.findByPlaceholderText("Enter your name");
    fireEvent.change(nameInput, { target: { value: "Enter Updated Name" } });
    fireEvent.keyDown(nameInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/updateName/user1",
        { name: "Enter Updated Name" },
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Enter Updated Name")).toBeInTheDocument();
    });
  });

  it("should show an error toast if name update fails", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 10,
        tasksCompleted: 1,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });
    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByText("User");

    userEvent.click(screen.getByText("User"));
    const nameInput = await screen.findByPlaceholderText("Enter your name");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.blur(nameInput);

    const tickButton = screen.getByTestId("tick-icon");
    userEvent.click(tickButton);

    await waitFor(() => {
      const { toast } = require("react-toastify");
      expect(toast.error).toHaveBeenCalledWith("Failed to update name!");
    });
  });

  it("should show a success toast when profile picture is saved", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });
    const fixedTimestamp = 1695673440987;
    jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);
    axios.post.mockResolvedValueOnce({
      data: {
        message: "Profile picture updated",
        profilePicture: `/uploads/user1-${fixedTimestamp}.jpg`,
      },
    });

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    userEvent.click(screen.getByAltText("Profile"));
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy image content"], "test.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    userEvent.click(await screen.findByText("Save"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    const { toast } = require("react-toastify");
    expect(toast.success).toHaveBeenCalledWith("Image saved!");

    jest.restoreAllMocks();
  });

  it("should show an error toast when profile picture upload fails", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        points: 0,
        tasksCompleted: 0,
        totalHours: "0.00",
        profilePicture: "",
        name: "User",
      },
    });

    jest
      .spyOn(profileService, "uploadProfilePicture")
      .mockRejectedValueOnce(new Error("Upload failed"));

    const { container } = render(
      <BrowserRouter>
        <NotificationsProvider>
          <Profile />
        </NotificationsProvider>
      </BrowserRouter>,
    );

    await screen.findByAltText("Profile");

    userEvent.click(screen.getByAltText("Profile"));
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy image content"], "test.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    userEvent.click(await screen.findByText("Save"));

    await waitFor(() => {
      const { toast } = require("react-toastify");
      expect(toast.error).toHaveBeenCalledWith("Failed to save image!");
    });
  });

  describe("Email Display", () => {
    it("should render the email below the profile image if user is logged in with an email", async () => {
      auth.currentUser = { uid: "user1", email: "test@example.com" };

      axios.get.mockResolvedValueOnce({
        data: {
          points: 10,
          tasksCompleted: 2,
          totalHours: "1.25",
          profilePicture: "/uploads/test.jpg",
          name: "User With Email",
        },
      });

      render(
        <BrowserRouter>
          <NotificationsProvider>
            <Profile />
          </NotificationsProvider>
        </BrowserRouter>,
      );

      const image = await screen.findByAltText("Profile");
      expect(image).toBeInTheDocument();

      const emailElement = await screen.findByText("test@example.com");
      expect(emailElement).toBeInTheDocument();

      expect(
        image.compareDocumentPosition(emailElement) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("should NOT render the email if user is logged in without an email", async () => {
      auth.currentUser = { uid: "user1", email: null };

      axios.get.mockResolvedValueOnce({
        data: {
          points: 10,
          tasksCompleted: 2,
          totalHours: "1.25",
          profilePicture: "/uploads/test.jpg",
          name: "User Without Email",
        },
      });

      render(
        <BrowserRouter>
          <NotificationsProvider>
            <Profile />
          </NotificationsProvider>
        </BrowserRouter>,
      );

      await screen.findByAltText("Profile");
      expect(screen.queryByText("User Without Email")).toBeInTheDocument();

      const emailElement = screen.queryByTestId("profile-email-lower");
      expect(emailElement).toBeNull();
    });
  });

  // ----------------------------------------------------
  // Button disabled state and loading indicator
  // ----------------------------------------------------
  describe("Profile Picture Upload UI Behavior", () => {
    it("should disable Save and Cancel buttons and show loading spinner when saving a new picture", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          points: 0,
          tasksCompleted: 0,
          totalHours: "0.00",
          profilePicture: "/uploads/test.jpg",
          name: "User",
        },
      });
      let resolveUpload;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve;
      });
      const uploadSpy = jest
        .spyOn(profileService, "uploadProfilePicture")
        .mockReturnValueOnce(uploadPromise);

      const { container } = render(
        <BrowserRouter>
          <NotificationsProvider>
            <Profile />
          </NotificationsProvider>
        </BrowserRouter>,
      );
      await screen.findByAltText("Profile");

      userEvent.click(screen.getByAltText("Profile"));
      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(["dummy image content"], "newtest.jpg", {
        type: "image/jpeg",
      });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const saveButton = await screen.findByRole("button", { name: "Save" });
      const cancelButton = await screen.findByRole("button", {
        name: "Cancel",
      });
      userEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
        expect(
          container.querySelector("#loadingIndicator"),
        ).toBeInTheDocument();
      });

      resolveUpload({
        data: {
          message: "Profile picture updated",
          profilePicture: `/uploads/user1-1234567890.jpg`,
        },
      });

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
        expect(container.querySelector("#loadingIndicator")).toBeNull();
      });

      uploadSpy.mockRestore();
    });

    it("should disable Save and Cancel buttons and show loading spinner when saving a picture removal", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          points: 0,
          tasksCompleted: 0,
          totalHours: "0.00",
          profilePicture: "/uploads/test.jpg",
          name: "User",
        },
      });
      let resolveRemove;
      const removePromise = new Promise((resolve) => {
        resolveRemove = resolve;
      });
      const removeSpy = jest
        .spyOn(profileService, "removeProfilePicture")
        .mockReturnValueOnce(removePromise);

      const { container } = render(
        <BrowserRouter>
          <NotificationsProvider>
            <Profile />
          </NotificationsProvider>
        </BrowserRouter>,
      );
      await screen.findByAltText("Profile");

      const removeButton = screen.getByRole("button", {
        name: "Remove profile picture",
      });
      userEvent.click(removeButton);

      const saveButton = await screen.findByRole("button", { name: "Save" });
      const cancelButton = await screen.findByRole("button", {
        name: "Cancel",
      });
      userEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
        expect(
          container.querySelector("#loadingIndicator"),
        ).toBeInTheDocument();
      });

      resolveRemove({
        data: { message: "Profile picture removed", profilePicture: "" },
      });

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
        expect(container.querySelector("#loadingIndicator")).toBeNull();
      });

      removeSpy.mockRestore();
    });
  });
});
