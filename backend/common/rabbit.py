# RabbitMQ 发布/订阅封装（pika 阻塞模式，容错重连）
import json
import logging
import threading

import pika

logger = logging.getLogger("rabbit")


def _connect(url: str):
    return pika.BlockingConnection(pika.URLParameters(url))


def publish(url: str, channel: str, message: dict, enabled: bool = True) -> bool:
    if not enabled:
        logger.info("[rabbit] 已禁用，跳过发布 %s", channel)
        return False
    try:
        conn = _connect(url)
        ch = conn.channel()
        ch.queue_declare(queue=channel, durable=True)
        ch.basic_publish(
            exchange="",
            routing_key=channel,
            body=json.dumps(message, ensure_ascii=False),
            properties=pika.BasicProperties(delivery_mode=2),  # 持久化
        )
        conn.close()
        return True
    except Exception as e:  # noqa: BLE001
        logger.warning("RabbitMQ 发布失败（不影响主流程）: %s", e)
        return False


def start_consumer(url: str, channel: str, callback, enabled: bool = True) -> None:
    """在后台线程启动消费者，断线自动重连"""
    if not enabled:
        logger.info("[rabbit] 消费者已禁用：%s", channel)
        return

    def run():
        while True:
            try:
                conn = _connect(url)
                ch = conn.channel()
                ch.queue_declare(queue=channel, durable=True)
                ch.basic_qos(prefetch_count=1)
                ch.basic_consume(queue=channel, on_message_callback=callback, auto_ack=True)
                logger.info("消费者已启动：%s", channel)
                ch.start_consuming()
            except Exception as e:  # noqa: BLE001
                logger.warning("消费者 %s 异常，3 秒后重连: %s", channel, e)
                threading.Event().wait(3)

    t = threading.Thread(target=run, daemon=True, name=f"consumer-{channel}")
    t.start()
