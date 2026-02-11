import { Kafka } from "kafkajs";
import { kafkaConfig } from "./config";

export const kafka = new Kafka(kafkaConfig)