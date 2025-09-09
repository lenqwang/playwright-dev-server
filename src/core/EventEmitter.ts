import type { EventName, EventPayload, EventHandler } from '../types.js';
import { logger } from './Logger.js'

/**
 * 事件发射器 - 用于插件间通信和生命周期管理
 */
export class EventEmitter {
  private listeners: Map<EventName, Set<EventHandler<any>>> = new Map();

  /**
   * 监听事件
   */
  on<T extends EventName>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * 移除事件监听器
   */
  off<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 发射事件
   */
  async emit<T extends EventName>(event: T, payload: EventPayload<T>): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // 并行执行所有处理器
    const promises = Array.from(handlers).map(handler => {
      try {
        return Promise.resolve(handler(payload));
      } catch (error) {
        logger.error(`Error in event handler for ${event}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * 一次性监听事件
   */
  once<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const onceHandler = (payload: EventPayload<T>) => {
      this.off(event, onceHandler);
      return handler(payload);
    };
    this.on(event, onceHandler);
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 获取事件的监听器数量
   */
  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size || 0;
  }
}