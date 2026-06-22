package com.mykare.healthcare.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology: a topic exchange with queues for appointment creation and cancellation.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "healthcare.exchange";
    public static final String CREATED_QUEUE = "appointment.created.queue";
    public static final String CANCELLED_QUEUE = "appointment.cancelled.queue";
    public static final String CREATED_ROUTING_KEY = "appointment.created";
    public static final String CANCELLED_ROUTING_KEY = "appointment.cancelled";

    @Bean
    public TopicExchange healthcareExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue appointmentCreatedQueue() {
        return QueueBuilder.durable(CREATED_QUEUE).build();
    }

    @Bean
    public Queue appointmentCancelledQueue() {
        return QueueBuilder.durable(CANCELLED_QUEUE).build();
    }

    @Bean
    public Binding createdBinding(Queue appointmentCreatedQueue, TopicExchange healthcareExchange) {
        return BindingBuilder.bind(appointmentCreatedQueue)
                .to(healthcareExchange)
                .with(CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding cancelledBinding(Queue appointmentCancelledQueue, TopicExchange healthcareExchange) {
        return BindingBuilder.bind(appointmentCancelledQueue)
                .to(healthcareExchange)
                .with(CANCELLED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
