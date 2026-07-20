'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Card, Table, Typography, Button, Space, Tag, Modal, Form, Input, Select, InputNumber, message, Row, Col, Spin, Alert } from 'antd';
import { AppstoreOutlined, TeamOutlined, UserOutlined, NotificationOutlined, BarChartOutlined, PlusOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../services/apiClient';

const { Title, Text } = Typography;

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [lopHocs, setLopHocs] = useState<any[]>([]);
  const [giaoViens, setGiaoViens] = useState<any[]>([]);
  const [tienDoKeHoachs, setTienDoKeHoachs] = useState<any[]>([]);
  const [progressType, setProgressType] = useState<string>('gvcn');
  
  // States cho Bảng Điểm
  const [selectedClassForGrades, setSelectedClassForGrades] = useState<string>('');
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  
  // States cho Tài khoản
  const [parentAccounts, setParentAccounts] = useState<any[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [crossCheckResult, setCrossCheckResult] = useState<string>('');
  const [selectedClassForParents, setSelectedClassForParents] = useState<string>('');
  
  // Modals
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  
  // States Modal Phân công & Thêm GV
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetTeacher, setAssignTargetTeacher] = useState('');
  
  const [classForm] = Form.useForm();
  const [crossCheckForm] = Form.useForm();
  const [teacherForm] = Form.useForm();
  const [assignHomeroomForm] = Form.useForm();
  const [assignSubjectForm] = Form.useForm();
  
  const [currentSelectedUsername, setCurrentSelectedUsername] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchTienDoData();
  }, [progressType]);

  const fetchTienDoData = async () => {
    try {
      const resTienDo = await apiClient.get(`/KeHoach/tien-do-toan-truong?loai=${progressType}`);
      if (resTienDo.data) setTienDoKeHoachs(resTienDo.data);
    } catch (err: any) {
      console.warn("Lỗi tải tiến độ kế hoạch:", err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Tải danh sách lớp
      const resLop = await apiClient.get('/LopHoc/danh-sach');
      if (resLop.data) setLopHocs(resLop.data);

      // 2. Tải danh sách giáo viên
      const resGV = await apiClient.get('/QuanLyTruong/danh-sach-giao-vien');
      if (resGV.data) setGiaoViens(resGV.data);

      // 3. Tải tiến độ kế hoạch
      await fetchTienDoData();
      
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu tổng quan!');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleAddClass = async (values: any) => {
    try {
      await apiClient.post('/LopHoc/them-moi', values);
      message.success('Đã thêm cấu trúc lớp học mới thành công!');
      setIsAddClassModalOpen(false);
      classForm.resetFields();
      fetchDashboardData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi thêm lớp học.');
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await apiClient.put(`/QuanLyTruong/reset-mat-khau/${currentSelectedUsername}`);
      message.success(res.data?.message || 'Đã khôi phục mật khẩu mặc định (123456) thành công!');
      setIsResetPassModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể khôi phục mật khẩu.');
    }
  };

  const handleDeleteAccount = async (username: string) => {
    try {
      const res = await apiClient.delete(`/TaiKhoan/xoa-tai-khoan/${username}`);
      message.success(res.data?.message || 'Đã xóa tài khoản khỏi hệ thống.');
      fetchDashboardData(); // Reload
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi thu hồi tài khoản.');
    }
  };

  const handleAddTeacher = async (values: any) => {
    try {
      const payload = {
        tenDangNhap: values.tenDangNhap,
        matKhau: values.matKhau || '123456',
        hoTen: values.hoTen,
        vaiTro: 'GiaoVien'
      };
      const res = await apiClient.post('/TaiKhoan/them-tai-khoan', payload);
      message.success(res.data?.message || 'Đã thêm giáo viên mới!');
      setIsAddTeacherModalOpen(false);
      teacherForm.resetFields();
      fetchDashboardData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi thêm tài khoản GV.');
    }
  };

  const handleAssignHomeroom = async (values: any) => {
    try {
      const res = await apiClient.post(`/QuanLyTruong/phan-cong-chu-nhiem?maLop=${values.maLop}&maGVCN=${assignTargetTeacher}`);
      message.success(res.data?.message || 'Đã phân công chủ nhiệm!');
      setIsAssignModalOpen(false);
      assignHomeroomForm.resetFields();
      fetchDashboardData(); 
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi phân công.');
    }
  };

  const handleAssignSubject = async (values: any) => {
    try {
      const payload = {
        maGiaoVien: assignTargetTeacher,
        maLop: values.maLop,
        maMon: values.maMon,
        thu: values.thu,
        buoi: values.buoi,
        tiet: values.tiet
      };
      const res = await apiClient.post('/QuanLyTruong/phan-cong-bo-mon', payload);
      message.success(res.data?.message || 'Đã phân công bộ môn!');
      setIsAssignModalOpen(false);
      assignSubjectForm.resetFields();
      fetchDashboardData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi phân công.');
    }
  };

  const fetchGradesForClass = async (classId: string) => {
    if (!classId) return;
    setLoadingGrades(true);
    try {
      const res = await apiClient.get(`/BangDiem/xuat-bang-diem-tong/${classId}`);
      if (res.data?.data && Array.isArray(res.data.data)) {
        setGradeData(res.data.data);
      } else if (res.data && Array.isArray(res.data)) {
        setGradeData(res.data);
      } else {
        setGradeData([]);
      }
    } catch (err: any) {
      setTimeout(() => message.error(err.response?.data?.message || 'Không có dữ liệu điểm cho lớp này.'), 500);
      setGradeData([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchParentsForClass = async (classId: string) => {
    if (!classId) return;
    setLoadingParents(true);
    setSelectedClassForParents(classId);
    try {
      const res = await apiClient.get(`/TaiKhoan/danh-sach-phu-huynh/theo-lop/${classId}`);
      if (res.data && Array.isArray(res.data)) {
         setParentAccounts(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
         setParentAccounts(res.data.data); // Xử lý trường hợp trả về { message: ..., data: [] }
      } else {
         setParentAccounts([]);
      }
    } catch (err: any) {
      setParentAccounts([]);
    } finally {
      setLoadingParents(false);
    }
  };

  const handleCrossCheck = async (values: any) => {
    try {
      const res = await apiClient.get(`/TaiKhoan/kiem-tra-phan-cong?maGiaoVien=${values.maGiaoVien}&maLop=${values.maLop}&maMon=${values.maMon}`);
      setCrossCheckResult(res.data?.message || 'Có quyền truy cập');
    } catch (err: any) {
      setCrossCheckResult(err.response?.data?.message || 'Không có quyền truy cập');
    }
  };

  // --- Columns động sinh từ kết quả Pivot giống GVCN ---
  const getDynamicGradeColumns = () => {
    const defaultCols = [
      { title: 'Mã HS', dataIndex: 'maHs', key: 'maHs', width: '15%', render: (t: string) => <b>{t}</b> },
      { title: 'Tên Học sinh', dataIndex: 'hoTen', key: 'hoTen', width: '30%' }
    ];

    if (!gradeData || gradeData.length === 0) {
      return defaultCols;
    }

    const firstStudent = gradeData[0];
    const subjectCols = (firstStudent.chiTietDiem || []).map((sub: any) => ({
      title: sub.tenMon,
      key: sub.tenMon,
      render: (_: any, record: any) => {
        const mon = record.chiTietDiem?.find((m: any) => m.tenMon === sub.tenMon);
        if (!mon) return '-';
        if (mon.diemThi !== null && mon.xepLoai) return `${mon.diemThi} (${mon.xepLoai})`;
        if (mon.diemThi !== null) return mon.diemThi;
        if (mon.xepLoai) return mon.xepLoai;
        return '-';
      }
    }));

    const rewardCol = {
      title: 'Danh hiệu thi đua',
      dataIndex: 'khenThuong',
      key: 'khenThuong',
      render: (val: string) => val ? <Tag color="gold" className="font-bold">{val}</Tag> : <Text type="secondary">-</Text>
    };

    return [...defaultCols, ...subjectCols, rewardCol];
  };

  const lopHocColumns = [
    { title: 'Mã Lớp', dataIndex: 'maLop', key: 'maLop', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Tên Lớp', dataIndex: 'tenLop', key: 'tenLop', className: 'font-semibold' },
    { title: 'Giáo viên Chủ nhiệm', dataIndex: 'gvchuNhiem', key: 'gvchuNhiem', render: (t: string) => t ? <Tag color="purple">{t}</Tag> : <Text type="secondary">Chưa phân công</Text> }
  ];

  const giaoVienColumns = [
    { title: 'Tài Khoản', dataIndex: 'tenDangNhap', key: 'tenDangNhap', render: (text: string) => <b>{text}</b> },
    { title: 'Họ Tên', dataIndex: 'hoTen', key: 'hoTen' },
    { title: 'Nhiệm vụ', dataIndex: 'nhiemVu', key: 'nhiemVu', render: (t: string) => <Tag color="cyan">{t || 'Giáo viên'}</Tag> },
    {
      title: 'Quản trị Tài khoản',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            type="primary"
            onClick={() => {
              setAssignTargetTeacher(record.tenDangNhap);
              setIsAssignModalOpen(true);
            }}>
            Phân công chuyên môn
          </Button>
          <Button 
            size="small" 
            icon={<LockOutlined />} 
            onClick={() => {
              setCurrentSelectedUsername(record.tenDangNhap);
              setIsResetPassModalOpen(true);
            }}>
            Reset Pass
          </Button>
          <Button 
            size="small" 
            danger 
            onClick={() => handleDeleteAccount(record.tenDangNhap)}>
            Hủy Tài khoản
          </Button>
        </Space>
      )
    }
  ];

  const handleSendReminder = async (maGiaoVien: string, maLop: string, maMon?: string) => {
    if (!maGiaoVien) {
      message.warning('Lớp học này chưa có giáo viên phụ trách!');
      return;
    }
    try {
      const res = await apiClient.post('/KeHoach/nhac-nho-kpi', {
        maGiaoVien: maGiaoVien.trim(),
        maLop: maLop.trim(),
        maMon: maMon ? maMon.trim() : null
      });
      message.success(res.data.message || 'Đã gửi nhắc nhở thành công!');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể gửi nhắc nhở.');
    }
  };

  const getTienDoColumns = () => {
    if (progressType === 'gvbm') {
      return [
        { title: 'Lớp', dataIndex: 'tenLop', key: 'tenLop', render: (t: string) => <b>Lớp {t}</b> },
        { title: 'Môn Học', dataIndex: 'monHoc', key: 'monHoc', render: (t: string) => <Tag color="cyan">{t}</Tag> },
        { title: 'Giáo viên bộ môn', dataIndex: 'giaoVien', key: 'giaoVien', render: (t: string) => <Tag color="orange">{t}</Tag> },
        { title: 'Tình trạng', dataIndex: 'trangThai', key: 'trangThai', render: (t: string) => <Tag color={t === 'Đã nộp' ? 'green' : 'red'}>{t}</Tag> },
        { title: 'Kế hoạch gần nhất', dataIndex: 'tieuDeGanNhat', key: 'tieuDeGanNhat', render: (t: string) => <Text type="secondary">{t || '-'}</Text> },
        { title: 'Ngày nộp', dataIndex: 'ngayNopGanNhat', key: 'ngayNopGanNhat', render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-' },
        { 
          title: 'Đôn Đốc', 
          key: 'action', 
          render: (_: any, record: any) => record.trangThai !== 'Đã nộp' ? (
            <Button size="small" type="primary" danger icon={<NotificationOutlined />} onClick={() => handleSendReminder(record.maGiaoVien, record.maLop, record.maMon)}>Nhắc nhở</Button>
          ) : null 
        }
      ];
    }

    return [
      { title: 'Lớp', dataIndex: 'tenLop', key: 'tenLop', render: (t: string) => <b>Lớp {t}</b> },
      { title: 'GVCN', dataIndex: 'gvchuNhiem', key: 'gvchuNhiem', render: (t: string) => t ? <Tag color="purple">{t}</Tag> : <Text type="secondary">Chưa có</Text> },
      { title: 'Tình trạng', dataIndex: 'trangThai', key: 'trangThai', render: (t: string) => <Tag color={t === 'Đã nộp' ? 'green' : 'red'}>{t}</Tag> },
      { title: 'Kế hoạch gần nhất', dataIndex: 'tieuDeGanNhat', key: 'tieuDeGanNhat', render: (t: string) => <Text type="secondary">{t || '-'}</Text> },
      { title: 'Ngày nộp', dataIndex: 'ngayNopGanNhat', key: 'ngayNopGanNhat', render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-' },
      { 
        title: 'Đôn Đốc', 
        key: 'action', 
        render: (_: any, record: any) => record.trangThai !== 'Đã nộp' ? (
          <Button size="small" type="primary" danger icon={<NotificationOutlined />} onClick={() => handleSendReminder(record.gvchuNhiem, record.maLop)}>Nhắc nhở</Button>
        ) : null 
      }
    ];
  };

  const items = [
    {
      key: '1',
      label: <span><AppstoreOutlined />Quản lý Lớp Học</span>,
      children: (
        <Card title="Giao diện theo dõi cấu trúc Lớp" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddClassModalOpen(true)}>Thêm Lớp Mới</Button>}>
          <Table dataSource={lopHocs} columns={lopHocColumns} rowKey="maLop" loading={loading} />
        </Card>
      ),
    },
    {
      key: '2',
      label: <span><TeamOutlined />Quản lý Trường & Nhân Sự</span>,
      children: (
        <Card title="Quản trị ban Nghề & Giáo Viên" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddTeacherModalOpen(true)}>Thêm Giáo viên Mới</Button><Button icon={<ReloadOutlined />} onClick={fetchDashboardData}>Làm mới</Button></Space>}>
           <Alert message="Phân công chuyên môn" description="Việc xếp thời khóa biểu và phân công chủ nhiệm được ủy quyền tại Module 1 (Hồ sơ phân công) để chặn trùng lịch." type="info" showIcon className="mb-4" />
          <Table dataSource={giaoViens} columns={giaoVienColumns} rowKey="tenDangNhap" loading={loading} />
        </Card>
      ),
    },
    {
      key: '3',
      label: <span><UserOutlined />Trạm Tài Khoản (Bảo mật)</span>,
      children: (
        <Card title="Giao diện An ninh Tài khoản">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <Card type="inner" title="1. Query Chéo Phân Công (Kiểm tra Quyền Ngầm)">
                <Form form={crossCheckForm} layout="vertical" onFinish={handleCrossCheck}>
                  <Form.Item name="maGiaoVien" label="Mã Giáo Viên" rules={[{ required: true }]}>
                    <Input placeholder="Nhập mã GV (VD: GVCN1A)" />
                  </Form.Item>
                  <Form.Item name="maLop" label="Mã Lớp Học" rules={[{ required: true }]}>
                    <Input placeholder="Nhập mã lớp (VD: L1A)" />
                  </Form.Item>
                  <Form.Item name="maMon" label="Mã Môn Học (nếu có)">
                    <Input placeholder="Để trống nếu định hỏi quyền Chủ nhiệm" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" className="w-full">
                    Truy vấn dữ liệu Server
                  </Button>
                </Form>
                {crossCheckResult && (
                  <Alert message="Kết quả Query" description={<span className="font-semibold text-slate-800">{crossCheckResult}</span>} type="info" showIcon className="mt-4 bg-slate-50" />
                )}
              </Card>
            </Col>
            
            <Col xs={24} lg={14}>
              <Card type="inner" title="2. Trích Xuất File Tài Khoản Phụ Huynh Theo Lớp">
                <div className="flex gap-2 mb-4 flex-wrap">
                  {lopHocs.map(c => (
                    <Button key={c.maLop} type={selectedClassForParents === c.maLop ? 'primary' : 'default'} onClick={() => fetchParentsForClass(c.maLop)}>
                      Lớp {c.tenLop}
                    </Button>
                  ))}
                </div>
                <Table 
                  dataSource={parentAccounts} 
                  rowKey="tenDangNhap"
                  loading={loadingParents}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: 'Tên Đăng Nhập', dataIndex: 'tenDangNhap', key: 'tenDangNhap', render: text => <b>{text}</b> },
                    { title: 'Tên Phụ Huynh', dataIndex: 'hoTen', key: 'hoTen' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: '4',
      label: <span><BarChartOutlined />Bảng Điểm Toàn Trường</span>,
      children: (() => {
        const countXuatSac = gradeData.filter(r => r.khenThuong === 'Học sinh xuất sắc').length;
        const countTieuBieu = gradeData.filter(r => r.khenThuong && r.khenThuong.startsWith('Học sinh tiêu biểu')).length;

        return (
          <Card title="Theo Dõi Tổng Kết Điểm Đánh Giá Năng Lực (Thông tư 27)">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-semibold text-slate-700">Chọn lớp cần xem:</span>
              <div className="flex flex-wrap gap-2">
                {lopHocs.map(c => (
                  <Button 
                    key={c.maLop} 
                    type={selectedClassForGrades === c.maLop ? 'primary' : 'default'}
                    onClick={() => {
                      setSelectedClassForGrades(c.maLop);
                      fetchGradesForClass(c.maLop);
                    }}>
                    Lớp {c.tenLop}
                  </Button>
                ))}
              </div>
            </div>

            {selectedClassForGrades && gradeData.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ color: '#065f46', fontWeight: 'bold', fontSize: '12px' }}>Học Sinh Xuất Sắc</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#047857', marginTop: '4px' }}>{countXuatSac} em</div>
                </div>
                <div style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div style={{ color: '#78350f', fontWeight: 'bold', fontSize: '12px' }}>Học Sinh Tiêu Biểu</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309', marginTop: '4px' }}>{countTieuBieu} em</div>
                </div>
              </div>
            )}

            {selectedClassForGrades ? (
              <Table dataSource={gradeData} columns={getDynamicGradeColumns()} rowKey="maHs" loading={loadingGrades} pagination={{ pageSize: 8 }} />
            ) : (
               <div className="text-center p-12 text-slate-400 border border-dashed rounded-xl border-slate-300">
                 Vui lòng chọn 1 Lớp học ở trên để trích xuất Bảng Điểm Khảo Thí từ SQL.
               </div>
            )}
          </Card>
        );
      })()
    },
    {
      key: '5',
      label: <span><NotificationOutlined />Đôn Đốc Kế Hoạch</span>,
      children: (
        <Card title="Trung tâm Đôn đốc Kế hoạch & Thông báo" extra={<Button icon={<ReloadOutlined />} onClick={fetchDashboardData}>Làm mới</Button>}>
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-700">Phân loại kế hoạch cần đôn đốc:</span>
            <Select 
              value={progressType} 
              onChange={(val) => setProgressType(val)} 
              style={{ width: 250 }}
              options={[
                { value: 'gvcn', label: 'Kế hoạch chủ nhiệm (GVCN)' },
                { value: 'gvbm', label: 'Kế hoạch môn học (GVBM)' }
              ]} 
            />
          </div>
          <Alert message="Kiểm soát KPI Kế hoạch" description="Kiểm tra kế hoạch giảng dạy của GVCN/GVBM để đôn đốc kịp thời qua mạng Zalo học vụ." type="info" showIcon className="mb-4" />
          <Table 
            dataSource={tienDoKeHoachs} 
            columns={getTienDoColumns()} 
            rowKey={(record: any) => progressType === 'gvbm' ? `${record.maLop}_${record.maMon}_${record.maGiaoVien}` : record.maLop} 
            loading={loading} 
          />
        </Card>
      ),
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={2} className="text-slate-800 m-0">Trung Tâm Điều Hành (BGH)</Title>
        <Text type="secondary">Tổng quan giám sát toàn diện mảng Học vụ, Cơ cấu tổ chức, và Phân quyền Trường Tiểu học Hàm Chính 2.</Text>
      </div>

      <Tabs defaultActiveKey="1" items={items} type="card" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200" />

      {/* Modal Thêm Lớp */}
      <Modal title="Mở cấu trúc Lớp học mới" open={isAddClassModalOpen} onOk={() => classForm.submit()} onCancel={() => setIsAddClassModalOpen(false)}>
        <Form form={classForm} layout="vertical" onFinish={handleAddClass}>
          <Form.Item name="maLop" label="Mã quy ước (ví dụ: L4A, L5B)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tenLop" label="Tên hiển thị (ví dụ: 4A, 5B)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Thêm GV */}
      <Modal title="Thêm Tài Khoản Giáo Viên Mới" open={isAddTeacherModalOpen} onOk={() => teacherForm.submit()} onCancel={() => setIsAddTeacherModalOpen(false)}>
        <Form form={teacherForm} layout="vertical" onFinish={handleAddTeacher}>
          <Form.Item name="tenDangNhap" label="Tên Đăng Nhập (Mã GV)" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: GV015" />
          </Form.Item>
          <Form.Item name="hoTen" label="Họ và Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="matKhau" label="Mật Khẩu (Để trống sẽ gán mặc định 123456)">
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Phân công */}
      <Modal title={`Phân công chuyên môn - ${assignTargetTeacher}`} open={isAssignModalOpen} onCancel={() => setIsAssignModalOpen(false)} footer={null} destroyOnHidden>
        <Tabs defaultActiveKey="1" items={[
          {
            key: '1',
            label: 'Chủ Nhiệm Lớp',
            children: (
              <Form form={assignHomeroomForm} layout="vertical" onFinish={handleAssignHomeroom}>
                <Form.Item name="maLop" label="Lớp Học" rules={[{ required: true }]}>
                  <Select placeholder="Chọn lớp...">
                    {lopHocs.map(c => <Select.Option key={c.maLop} value={c.maLop}>{c.tenLop}</Select.Option>)}
                  </Select>
                </Form.Item>
                <Button type="primary" htmlType="submit" className="w-full">Xác nhận phân công Chủ nhiệm</Button>
              </Form>
            )
          },
          {
            key: '2',
            label: 'Nhập Dạy Bộ Môn',
            children: (
              <Form form={assignSubjectForm} layout="vertical" onFinish={handleAssignSubject}>
                <Form.Item name="maLop" label="Học Lớp" rules={[{ required: true }]}>
                  <Select placeholder="Chọn lớp...">
                    {lopHocs.map(c => <Select.Option key={c.maLop} value={c.maLop}>{c.tenLop}</Select.Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="maMon" label="Mã Môn Học" rules={[{ required: true }]}>
                  <Input placeholder="Ví dụ: TOAN (Toán), TV (Tiếng Việt)..." />
                </Form.Item>
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item name="thu" label="Thứ" rules={[{ required: true }]}>
                      <Select>
                        {['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6'].map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="buoi" label="Buổi" rules={[{ required: true }]}>
                      <Select>
                        <Select.Option value="Sáng">Sáng</Select.Option>
                        <Select.Option value="Chiều">Chiều</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="tiet" label="Tiết Số" rules={[{ required: true }]}>
                      <InputNumber min={1} max={5} style={{width: '100%'}} />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" htmlType="submit" className="w-full">Ghi nhận Lịch Phân Công Bộ Môn</Button>
              </Form>
            )
          }
        ]} />
      </Modal>

      {/* Modal Reset Pass */}
      <Modal title="Xác nhận Reset Hệ Sinh Thái Bảo Mật" open={isResetPassModalOpen} onOk={handleResetPassword} onCancel={() => setIsResetPassModalOpen(false)} okButtonProps={{ danger: true }}>
        <p>Bạn có chắc chắn muốn ép buộc hệ thống C# thiết lập lại mật khẩu tài khoản <b>{currentSelectedUsername}</b> về mặc định?</p>
      </Modal>
    </div>
  );
}
