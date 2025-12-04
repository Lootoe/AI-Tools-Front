// 格式化时间戳为可读字符串
export function formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)}天前`;
    } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// 生成唯一ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 根据第一条消息生成对话标题
export function generateConversationTitle(content: string): string {
    const maxLength = 30;
    if (content.length <= maxLength) {
        return content;
    }
    return content.substring(0, maxLength) + '...';
}
