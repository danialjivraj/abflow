import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import {
  NotificationsProvider,
  NotificationsContext,
} from "../../src/contexts/NotificationsContext";
import { fetchNotifications } from "../../src/services/notificationService";
import { auth } from "../../src/firebase";
import { createBaseUser } from "../../_testUtils/createBaseUser";
import { createBaseNotification } from "../../_testUtils/createBaseNotification";

const NotificationsTestConsumer = ({ onChange }) => {
  const { notifications } = React.useContext(NotificationsContext);
  React.useEffect(() => {
    onChange(notifications);
  }, [notifications, onChange]);
  return null;
};

jest.mock("../../src/services/notificationService", () => ({
  fetchNotifications: jest.fn(),
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

  it("plays sound when 1 notification is added after initial load", async () => {
    const notificationsHistory = [];
    const onChange = (notifs) => {
      notificationsHistory.push(notifs);
    };

    fetchNotifications
      .mockResolvedValueOnce({
        data: { notifications: [] },
      })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
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
      expect(notificationsHistory.length).toBeGreaterThan(0);
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        1
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        1
      );
    });

    await waitFor(
      () => {
        expect(playMock).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    jest.useRealTimers();
  });

  it("plays sound when new notifications are added after initial load", async () => {
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
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
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
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
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
      expect(notificationsHistory.length).toBeGreaterThan(0);
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        1
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        2
      );
    });

    await waitFor(
      () => {
        expect(playMock).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    jest.useRealTimers();
  });

  it("plays sound again when an additional notification is added after a previous notification", async () => {
    const notificationsHistory = [];
    const onChange = (notifs) => {
      notificationsHistory.push(notifs);
    };

    fetchNotifications
      .mockResolvedValueOnce({
        data: { notifications: [] },
      })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            createBaseNotification({
              _id: "notif1",
              message: "First notification",
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
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
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
            }),
            createBaseNotification({
              _id: "notif2",
              message: "Second notification",
            }),
            createBaseNotification({
              _id: "notif3",
              message: "Third notification",
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
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        1
      );
    });
    // First increase should play sound.
    await waitFor(
      () => {
        expect(playMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
    playMock.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        2
      );
    });
    // Second increase should play sound.
    await waitFor(
      () => {
        expect(playMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
    playMock.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      expect(notificationsHistory[notificationsHistory.length - 1].length).toBe(
        3
      );
    });
    // Third increase should play sound again.
    await waitFor(
      () => {
        expect(playMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    jest.useRealTimers();
  });

  it("does not play sound if notifications count does not increase", async () => {
    fetchNotifications.mockResolvedValue({
      data: {
        notifications: [
          createBaseNotification({
            _id: "notif1",
            message: "Only notification",
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
});
