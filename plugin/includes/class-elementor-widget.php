<?php
/**
 * Elementor Live Chat Trigger Widget
 *
 * @package TeleConnect_Live_Chat
 */

if (!defined('ABSPATH')) {
    exit;
}

class TeleConnect_Elementor_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'teleconnect_button_widget';
    }

    public function get_title() {
        return 'دکمه چت آنلاین تلگرام';
    }

    public function get_icon() {
        return 'eicon-comments';
    }

    public function get_categories() {
        return ['general'];
    }

    public function get_keywords() {
        return ['chat', 'telegram', 'livechat', 'support', 'چت', 'تلگرام', 'پشتیبانی'];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => 'محتوا',
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'button_text',
            [
                'label'       => 'متن دکمه',
                'type'        => \Elementor\Controls_Manager::TEXT,
                'default'     => 'شروع گفتگو با کارشناس',
                'placeholder' => 'متن دکمه را وارد کنید',
            ]
        );

        $this->add_control(
            'button_icon',
            [
                'label'   => 'آیکون',
                'type'    => \Elementor\Controls_Manager::ICONS,
                'default' => [
                    'value'   => 'fab fa-telegram-plane',
                    'library' => 'fa-brands',
                ],
            ]
        );

        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section(
            'style_section',
            [
                'label' => 'استایل دکمه',
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'     => 'typography',
                'selector' => '{{WRAPPER}} .teleconnect-elementor-btn',
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label'     => 'رنگ متن',
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .teleconnect-elementor-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Background::get_type(),
            [
                'name'     => 'background',
                'types'    => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} .teleconnect-elementor-btn',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'     => 'border',
                'selector' => '{{WRAPPER}} .teleconnect-elementor-btn',
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label'      => 'گوشه‌های گرد (Border Radius)',
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .teleconnect-elementor-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'padding',
            [
                'label'      => 'فاصله درونی (Padding)',
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .teleconnect-elementor-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="teleconnect-elementor-wrapper">
            <button type="button" class="teleconnect-elementor-btn" onclick="if(window.teleConnectOpen){window.teleConnectOpen();}return false;">
                <?php if (!empty($settings['button_icon']['value'])) : ?>
                    <span class="teleconnect-btn-icon">
                        <?php \Elementor\Icons_Manager::render_icon($settings['button_icon'], ['aria-hidden' => 'true']); ?>
                    </span>
                <?php endif; ?>
                <span class="teleconnect-btn-text"><?php echo esc_html($settings['button_text']); ?></span>
            </button>
        </div>
        <style>
            .teleconnect-elementor-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-family: inherit;
                font-size: 15px;
                font-weight: 600;
                padding: 12px 24px;
                background-color: var(--teleconnect-primary, #0088cc);
                color: #fff;
                border: none;
                border-radius: 50px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-decoration: none;
            }
            .teleconnect-elementor-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 136, 204, 0.3);
            }
        </style>
        <?php
    }
}
