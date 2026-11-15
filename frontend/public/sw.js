self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (_) {}
  const title = data.title || "Qureshi's House"
  const options = {
    body: data.body || "Aaj ki purchases add karna mat bhoolna! ❤️",
    icon: "/q-mark.svg",
    badge: "/q-mark.svg",
    tag: data.tag || "daily-purchase-reminder",
    renotify: true,
    data: { url: data.url || "/" }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: "window", includeUncontrolled: true })
    for (const client of clientsList) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.focus()
        if ("navigate" in client) await client.navigate(target)
        return
      }
    }
    if (clients.openWindow) await clients.openWindow(target)
  })())
})
