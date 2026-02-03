type UpdateChatUrlDeps = {
  location: Pick<Location, 'href' | 'reload'>;
  history: Pick<History, 'replaceState'>;
};

export function updateChatUrlWithReloadWithDeps(deps: UpdateChatUrlDeps, chatId: string) {
  const newUrl = new URL(deps.location.href);
  newUrl.searchParams.set('c', chatId);
  deps.history.replaceState({}, '', newUrl.toString());
}

export function updateChatUrlWithReload(chatId: string) {
  updateChatUrlWithReloadWithDeps(
    { location: window.location, history: window.history },
    chatId
  );
}
