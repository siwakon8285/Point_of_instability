const _defaultAvatar = '/assets/unnamed.jpg'

export const getAvatar = (url: string | undefined) => {
    if (url) return url
    return _defaultAvatar
}
