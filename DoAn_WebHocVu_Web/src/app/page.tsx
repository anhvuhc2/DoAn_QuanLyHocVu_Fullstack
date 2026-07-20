'use client';

import React from 'react';
import { Card, Col, Row, Typography, Button, Space, Tag, List, Divider } from 'antd';
import {
  BookOutlined,
  CheckSquareOutlined,
  NotificationOutlined,
  MessageOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  RobotOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const modules = [
    {
      title: 'Hồ sơ & Phân công',
      desc: 'Quản lý thông tin hồ sơ học sinh, giáo viên, danh sách lớp học và thuật toán chống trùng lịch khi phân công giảng dạy.',
      path: '/modules/class-profile',
      icon: <BookOutlined className="text-3xl text-blue-500" />,
      color: '#e6f7ff',
      borderColor: '#91d5ff',
      tag: 'Module 1'
    },
    {
      title: 'Đánh giá & Báo điểm',
      desc: 'Hệ thống nhập điểm, nhận xét bám sát quy chuẩn đánh giá năng lực của Bộ Giáo dục (Thông tư 27) với kiểm tra toàn vẹn dữ liệu.',
      path: '/modules/grading-evaluation',
      icon: <CheckSquareOutlined className="text-3xl text-emerald-500" />,
      color: '#f6ffed',
      borderColor: '#b7eb8f',
      tag: 'Module 2'
    },
    {
      title: 'Kế hoạch & Thông báo',
      desc: 'Kênh truyền thông kép (Môn học vụ - Học tập / Sự kiện - Kế hoạch) đính kèm tệp đa văn bản và theo dõi trạng thái đã đọc.',
      path: '/modules/planning-notifications',
      icon: <NotificationOutlined className="text-3xl text-orange-500" />,
      color: '#fff7e6',
      borderColor: '#ffd591',
      tag: 'Module 3'
    },
    {
      title: 'Tương tác & Trợ lý AI',
      desc: 'Tích hợp Trợ lý ảo AI Google Gemini tự động giải thích luật học vụ, luật Thông tư 27 dưới dạng đối chứng thực tế và phân luồng thông tinh.',
      path: '/modules/ai-assistant',
      icon: <RobotOutlined className="text-3xl text-purple-500 animate-bounce" />,
      color: '#f9f0ff',
      borderColor: '#d3adf7',
      tag: 'Module 4'
    }
  ];

  const techStack = [
    { name: 'C# ASP.NET Core API', desc: 'Backend RESTful API, Endpoint Authorization & JWT' },
    { name: 'SQL Server 2014 & EF Core', desc: '9 tables database with composite unique checks constraints' },
    { name: 'Next.js App Router (v16)', desc: 'SSR, Client Router, TypeScript-first development' },
    { name: 'Ant Design (v5)', desc: 'Integrated Tables, Validation Forms, Modals & Components' },
    { name: 'Tailwind CSS (v4)', desc: 'Responsive utility styles layout system' },
  ];

  return (
    <div className="py-2">
      {/* Intro hero banner */}
      <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-8 translate-x-8">
          <DatabaseOutlined style={{ fontSize: '300px' }} />
        </div>
        <Title level={1} className="text-white m-0" style={{ color: 'white' }}>
          Đồ án Tốt nghiệp Hệ thống Quản lý Học vụ
        </Title>
        <Paragraph className="text-slate-100/90 text-sm mt-3 max-w-3xl leading-relaxed">
          Chào mừng quý thầy cô đến với cổng quản trị và học bạ điện tử trường Tiểu học Hàm Chính 2.
          Hệ thống được phát triển phân tách Back-end độc lập (ASP.NET Core API) và Front-end (Next.js & Ant Design),
          bảo mật phân quyền 2 tầng linh hoạt, cùng lõi Trí tuệ Nhân tạo trợ lực đòn bẩy giao tiếp nhà trường - phụ huynh.
        </Paragraph>
        <Space size="middle" className="mt-4">
          <Link href="/modules/class-profile">
            <Button type="primary" size="large" className="bg-emerald-500 hover:bg-emerald-600 border-none font-semibold flex items-center gap-2">
              Bắt đầu khảo sát <ArrowRightOutlined />
            </Button>
          </Link>
          <Button ghost size="large" href="https://nextjs.org/docs" target="_blank">
            Tài liệu Project
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 24]}>
        {/* Left column: 4 modules */}
        <Col xs={24} lg={16}>
          <div className="mb-4">
            <Title level={3} className="text-slate-800 m-0">4 Phân Hệ Nghiệp Vụ Cốt Lõi</Title>
            <Paragraph className="text-slate-400 text-xs">Các tác vụ nghiệp vụ được thiết lập quy trình nhất quán</Paragraph>
          </div>
          
          <Row gutter={[16, 16]}>
            {modules.map((m, idx) => (
              <Col xs={24} sm={12} key={idx}>
                <Card
                  hoverable
                  className="h-full flex flex-col justify-between transition-transform duration-250 hover:-translate-y-1 shadow-sm border border-slate-200"
                  styles={{ body: { 
                    padding: '24px', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    gap: '16px'
                  } }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color, border: `1px solid ${m.borderColor}` }}>
                        {m.icon}
                      </div>
                      <Tag color={m.tag === 'Module 4' ? 'purple' : 'blue'} className="font-semibold">{m.tag}</Tag>
                    </div>
                    <Title level={4} className="m-0 text-slate-800">{m.title}</Title>
                    <Paragraph className="text-slate-500 text-xs mt-2 leading-relaxed">
                      {m.desc}
                    </Paragraph>
                  </div>
                  <Link href={m.path} className="w-full">
                    <Button type="link" className="p-0 flex items-center gap-1 font-semibold group">
                      Truy cập Module <ArrowRightOutlined className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        {/* Right column: Highlights and summary statistics */}
        <Col xs={24} lg={8}>
          <Card className="shadow-sm border-slate-200 mb-6 bg-slate-900 text-white" title={<span className="text-white flex items-center gap-2"><SafetyOutlined className="text-indigo-400"/> Bảo Mật & Ràng Buộc Kép</span>}>
            <div className="flex flex-col gap-4 text-xs">
              <div>
                <Tag color="gold" className="mb-2">RBAC Quyền Hạn</Tag>
                <Paragraph className="text-slate-300 m-0 leading-relaxed">
                  Hiệu trưởng có quyền quản trị tối cao, Giáo viên chủ nhiệm được gán quyền lớp đang phụ trách, Giáo viên bộ môn giới hạn vào môn & lớp dạy. Phụ huynh chỉ xem con em mình.
                </Paragraph>
              </div>
              <Divider className="border-gray-800 m-0"/>
              <div>
                <Tag color="cyan" className="mb-2">ABAC Mỏ Neo Dữ Liệu</Tag>
                <Paragraph className="text-slate-300 m-0 leading-relaxed">
                  Ngăn chặn trôi lập dữ liệu xuyên lớp. Thao tác hồ sơ hay tạo tài khoản bắt buộc bám mã Lớp / mã Học sinh đang học.
                </Paragraph>
              </div>
              <Divider className="border-gray-800 m-0"/>
              <div>
                <Tag color="magenta" className="mb-2">Double-Booking & Composite Checks</Tag>
                <Paragraph className="text-slate-300 m-0 leading-relaxed">
                  Hệ thống tự động khóa gán thời giảng dạy nếu giáo viên/lớp bị trùng giờ. Hỗ trợ điểm danh Upsert, bảo toàn duy nhất cặp khóa ngày vắng của học sinh.
                </Paragraph>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border border-slate-200" title={<span className="flex items-center gap-2 text-slate-800"><ThunderboltOutlined className="text-yellow-500" /> Hệ Thống Công Nghệ Sử Dụng</span>}>
            <div className="flex flex-col">
              {techStack.map((item: any, i: number) => (
                <div key={i} className="py-2 px-0 border-b border-slate-100 flex flex-col items-start gap-1">
                  <Text className="font-semibold text-xs text-slate-800">{item.name}</Text>
                  <Text className="text-[11px] text-slate-500">{item.desc}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
