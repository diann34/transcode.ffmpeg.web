export type FriendLink = {
  name: string
  url: string
}

/**
 * 站点链接配置：替换 githubUrl，并按需添加或删除 friendLinks 条目。
 */
export const siteConfig = {
  githubUrl: 'https://github.com/',
  friendLinks: [
    // { name: '示例站点', url: 'https://example.com' },
  ] as FriendLink[],
}
