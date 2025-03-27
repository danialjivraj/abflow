import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  NotificationsProvider,
  NotificationsContext,
} from "../../src/contexts/NotificationsContext";
import {
  fetchNotifications,
  updateNotification,
} from "../../src/services/notificationService";
import { auth } from "../../src/firebase";
import { createBaseUser } from "../../_testUtils/createBaseUser";
import { createBaseNotification } from "../../_testUtils/createBaseNotification";
import { toast } from "react-toastify";

jest.mock("react-toastify", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const NotificationsTestConsumer = ({ onChange }) => {
  const { notifications } = React.useContext(NotificationsContext);
  React.useEffect(() => {
    onChange(notifications);
  }, [notifications, onChange]);
  return null;
};

jest.mock("../../src/services/notificationService", () => ({
  fetchNotifications: jest.fn(),
  updateNotification: jest.fn().mockResolvedValue({}),
}));

let currentUser = null;
const authMock = {
  get currentUser() {
    return currentUser;
  },
  set currentUser(val) {
    currentUser = val;
  },
  onAuthStateChanged: (callback) => {
    callback(currentUser);
    return jest.fn();
  },
};

jest.mock("../../src/firebase", () => ({
  auth: authMock,
}));

describe("NotificationsContext", () => {
  let playMock;
  let originalAudio;

  beforeAll(() => {
    originalAudio = global.Audio;
    playMock = jest.fn().mockResolvedValue();
    global.Audio = jest.fn().mockImplementation(() => ({
      play: playMock,
    }));
  });

  afterAll(() => {
    global.Audio = originalAudio;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const user = createBaseUser();
    auth.currentUser = { uid: user.userId };
  });

  it("renders children", () => {
    const { getByText } = render(
      <NotificationsProvider>
        <div>Test Child</div>
      </NotificationsProvider>
    );
    expect(getByText("Test Child")).toBeInTheDocument();
  });

  it("plays sound when 1 notification (soundPlayed:false) is added after initial load", async () => {
    const notificationsHistory = [];
    const onChange = (notifs) => {
      notificationsHistory.push(notifs);
    };

    fetchNotifications
      .mockResolvedValueOnce({ data: { notifications: [] } })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: false,
            }),
          ],
        },
      })
      .mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: true,
            }),
          ],
        },
      });

    jest.useFakeTimers();

    render(
      <NotificationsProvider>
        <div>Test Child</div>
        <NotificationsTestConsumer onChange={onChange} />
      </NotificationsProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(
        notificationsHistory[notificationsHistory.length - 1]
      ).toHaveLength(0);
    });

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(
      () => {
        expect(updateNotification).toHaveBeenCalledWith("notif1", {
          soundPlayed: true,
        });
        expect(playMock).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      const latest = notificationsHistory[notificationsHistory.length - 1];
      expect(latest[0].soundPlayed).toBe(true);
    });

    jest.useRealTimers();
  });

  it("plays sound when new notification is added after initial load", async () => {
    const notificationsHistory = [];
    const onChange = (notifs) => {
      notificationsHistory.push(notifs);
    };

    fetchNotifications
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: true,
            }),
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: true,
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
              soundPlayed: false,
            }),
          ],
        },
      })
      .mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: true,
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
              soundPlayed: true,
            }),
          ],
        },
      });

    jest.useFakeTimers();

    render(
      <NotificationsProvider>
        <div>Test Child</div>
        <NotificationsTestConsumer onChange={onChange} />
      </NotificationsProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });
    await waitFor(() => {
      const latest = notificationsHistory[notificationsHistory.length - 1];
      expect(latest).toHaveLength(1);
    });

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(
      () => {
        expect(updateNotification).toHaveBeenCalledWith("notif2", {
          soundPlayed: true,
        });
        expect(playMock).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      const latest = notificationsHistory[notificationsHistory.length - 1];
      expect(latest.find((n) => n._id === "notif2").soundPlayed).toBe(true);
    });

    jest.useRealTimers();
  });

  it("plays sound again when an additional notification is added after a previous one", async () => {
    const notificationsHistory = [];
    const onChange = (notifs) => {
      notificationsHistory.push(notifs);
    };

    fetchNotifications
      .mockResolvedValueOnce({ data: { notifications: [] } })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: false,
            }),
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: true,
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
              soundPlayed: false,
            }),
          ],
        },
      })
      .mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
              soundPlayed: true,
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
              soundPlayed: true,
            }),
            createBaseNotification({
              _id: "notif3",
              message: "Third notification",
              soundPlayed: false,
            }),
          ],
        },
      });

    jest.useFakeTimers();

    render(
      <NotificationsProvider>
        <div>Test Child</div>
        <NotificationsTestConsumer onChange={onChange} />
      </NotificationsProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      const latest = notificationsHistory[notificationsHistory.length - 1];
      expect(latest).toHaveLength(1);
    });
    await waitFor(() => {
      expect(playMock).toHaveBeenCalledTimes(1);
      expect(updateNotification).toHaveBeenCalledWith("notif1", {
        soundPlayed: true,
      });
    });
    playMock.mockClear();
    jest.clearAllMocks();

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      const latest = notificationsHistory[notificationsHistory.length - 1];
      expect(latest).toHaveLength(2);
    });
    await waitFor(() => {
      expect(playMock).toHaveBeenCalledTimes(1);
      expect(updateNotification).toHaveBeenCalledWith("notif2", {
        soundPlayed: true,
      });
    });
    playMock.mockClear();
    jest.clearAllMocks();

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      const latest = notificationsHistory[notificationsHistory.length - 1];
      expect(latest).toHaveLength(3);
    });
    await waitFor(() => {
      expect(playMock).toHaveBeenCalledTimes(1);
      expect(updateNotification).toHaveBeenCalledWith("notif3", {
        soundPlayed: true,
      });
    });

    jest.useRealTimers();
  });

  it("does not play sound when muteNotifications is true", async () => {
    const baseUser = createBaseUser({
      settingsPreferences: {
        ...createBaseUser().settingsPreferences,
        muteNotifications: true,
      },
    });
    auth.currentUser = { uid: baseUser.userId };

    fetchNotifications
      .mockResolvedValueOnce({ data: { notifications: [] } })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Muted notification",
              soundPlayed: false,
            }),
          ],
        },
      })
      .mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Muted notification",
              soundPlayed: false,
            }),
          ],
        },
      });

    jest.useFakeTimers();

    render(
      <NotificationsProvider
        muteNotifications={baseUser.settingsPreferences.muteNotifications}
      >
        <div>Test Child</div>
        <NotificationsTestConsumer onChange={() => {}} />
      </NotificationsProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(
      () => {
        expect(playMock).not.toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    jest.useRealTimers();
  });

  it("does not play sound if notification count does not increase", async () => {
    fetchNotifications.mockResolvedValue({
      data: {
        notifications: [
          createBaseNotification({
            _id: "notif1",
            message: "Only notification",
            soundPlayed: true,
          }),
        ],
      },
    });

    jest.useFakeTimers();

    render(
      <NotificationsProvider>
        <div>Test Child</div>
      </NotificationsProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    playMock.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(playMock).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  describe("NotificationsContext Toast Logic", () => {
    it("displays correct toast message for Alert prefix", async () => {
      fetchNotifications.mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Alert: Something happened",
              soundPlayed: false,
            }),
          ],
        },
      });
      jest.useFakeTimers();
      render(
        <NotificationsProvider>
          <div>Test Child</div>
        </NotificationsProvider>
      );
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalled();
        const messageElement = toast.info.mock.calls[0][0];
        const rendered = renderToStaticMarkup(messageElement);
        expect(rendered).toContain(
          'You got an <span class="notification-title-alert">Alert</span>notification!'
        );
      });
      jest.useRealTimers();
    });

    it("displays correct toast message for Weekly Insight prefix with line break", async () => {
      fetchNotifications.mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Weekly Insight: Check your stats",
              soundPlayed: false,
            }),
          ],
        },
      });
      jest.useFakeTimers();
      render(
        <NotificationsProvider>
          <div>Test Child</div>
        </NotificationsProvider>
      );
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalled();
        const messageElement = toast.info.mock.calls[0][0];
        const rendered = renderToStaticMarkup(messageElement);
        expect(rendered).toContain(
          'You got a <span class="notification-title-insight">Weekly Insight</span><br/>notification!'
        );
      });
      jest.useRealTimers();
    });

    it("displays correct toast message for Reminder prefix", async () => {
      fetchNotifications.mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Reminder: Check your schedule",
              soundPlayed: false,
            }),
          ],
        },
      });
      jest.useFakeTimers();
      render(
        <NotificationsProvider>
          <div>Test Child</div>
        </NotificationsProvider>
      );
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalled();
        const messageElement = toast.info.mock.calls[0][0];
        const rendered = renderToStaticMarkup(messageElement);
        expect(rendered).toContain(
          'You got a <span class="notification-title-reminder">Reminder</span>notification!'
        );
      });
      jest.useRealTimers();
    });

    it("displays correct toast message for Warning prefix", async () => {
      fetchNotifications.mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Warning: Check your system",
              soundPlayed: false,
            }),
          ],
        },
      });
      jest.useFakeTimers();
      render(
        <NotificationsProvider>
          <div>Test Child</div>
        </NotificationsProvider>
      );
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalled();
        const messageElement = toast.info.mock.calls[0][0];
        const rendered = renderToStaticMarkup(messageElement);
        expect(rendered).toContain(
          'You got a <span class="notification-title-warning">Warning</span>notification!'
        );
      });
      jest.useRealTimers();
    });

    it("displays correct toast message for default case", async () => {
      fetchNotifications.mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Random message without prefix",
              soundPlayed: false,
            }),
          ],
        },
      });
      jest.useFakeTimers();
      render(
        <NotificationsProvider>
          <div>Test Child</div>
        </NotificationsProvider>
      );
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalled();
        const messageElement = toast.info.mock.calls[0][0];
        const rendered = renderToStaticMarkup(messageElement);
        expect(rendered).toContain("You got a new notification!");
      });
      jest.useRealTimers();
    });

    it("closes toast and opens notification dropdown when toast is clicked", async () => {
      window.openNotifications = jest.fn();
      fetchNotifications.mockResolvedValue({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "Alert: Something happened",
              soundPlayed: false,
            }),
          ],
        },
      });
      jest.useFakeTimers();
      render(
        <NotificationsProvider>
          <div>Test Child</div>
        </NotificationsProvider>
      );
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalled();
      });

      const onClickCallback = toast.info.mock.calls[0][1].onClick;

      onClickCallback();
      expect(window.openNotifications).toHaveBeenCalled();
      expect(toast.dismiss).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
