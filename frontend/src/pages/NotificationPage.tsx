import { MobileHeader } from '../components/MobileHeader';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationPage() {
  // TODO: API에서 알림 데이터 로드
  const notifications: Notification[] = [];

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="알림" />
      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <p className="text-xs text-gray-400">{notification.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

