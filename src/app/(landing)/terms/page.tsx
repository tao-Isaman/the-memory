import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import HeartIcon from '@/components/HeartIcon';
import {
  CONSENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_CONTACT_EMAIL,
  SERVICE_NAME,
  SERVICE_URL,
} from '@/data/legal';

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน | The Memory',
  description:
    'ข้อกำหนดการใช้งานของ The Memory — เงื่อนไขการใช้บริการ การชำระเงิน เนื้อหาของผู้ใช้ ฟีเจอร์จักรวาล และข้อจำกัดความรับผิด',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-kanit text-lg font-semibold text-[#4A1942] mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen relative z-10 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E63946] transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          กลับหน้าหลัก
        </Link>

        <div className="memory-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <HeartIcon size={28} />
            <h1 className="font-kanit text-2xl md:text-3xl font-bold text-[#4A1942]">
              ข้อกำหนดการใช้งาน
            </h1>
          </div>
          <p className="text-xs text-gray-400 mb-8">
            เวอร์ชัน {CONSENT_VERSION} &bull; มีผลบังคับใช้ตั้งแต่วันที่ {LEGAL_EFFECTIVE_DATE}
          </p>

          <Section title="1. การยอมรับข้อกำหนด">
            <p>
              การสมัครใช้งานหรือเข้าใช้บริการ {SERVICE_NAME} ({SERVICE_URL})
              ถือว่าท่านได้อ่าน เข้าใจ และตกลงผูกพันตามข้อกำหนดการใช้งานฉบับนี้ รวมถึง{' '}
              <Link href="/privacy" className="text-[#E63946] underline">
                นโยบายความเป็นส่วนตัว
              </Link>{' '}
              ของเรา หากท่านไม่ยอมรับ กรุณางดใช้บริการ
            </p>
          </Section>

          <Section title="2. บริการของเรา">
            <p>
              {SERVICE_NAME} เป็นแพลตฟอร์มสำหรับสร้าง &ldquo;ความทรงจำ&rdquo; ดิจิทัล —
              การนำเสนอเรื่องราวจากรูปภาพ ข้อความ เสียง วิดีโอ และลูกเล่นอื่น
              เพื่อแชร์ให้คนพิเศษผ่านลิงก์หรือ QR Code โดยมีบริการเสริม เช่น
              การสร้างรูปการ์ตูนด้วย AI ผ่านระบบเครดิต และฟีดจักรวาลสำหรับชมเรื่องราวที่ผู้ใช้คนอื่นแชร์
            </p>
          </Section>

          <Section title="3. บัญชีผู้ใช้">
            <ul className="list-disc pl-5 space-y-2">
              <li>การเข้าสู่ระบบทำผ่านบัญชี Google ของท่าน</li>
              <li>ท่านต้องรับผิดชอบกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน</li>
              <li>ห้ามใช้บัญชีของผู้อื่นหรือแอบอ้างเป็นบุคคลอื่น</li>
            </ul>
          </Section>

          <Section title="4. การชำระเงินและเครดิต">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                การเปิดใช้งานความทรงจำเพื่อแชร์มีค่าบริการตามที่แสดงในหน้าชำระเงิน
                ชำระครั้งเดียว เก็บได้ตลอด ผ่านระบบ Stripe (บัตรเครดิต/เดบิต หรือพร้อมเพย์)
              </li>
              <li>เครดิตสำหรับฟีเจอร์ AI ซื้อเป็นแพ็กเกจตามราคาที่แสดงในหน้าเครดิต</li>
              <li>
                หากการสร้างรูปการ์ตูนด้วย AI ล้มเหลว ระบบจะคืนเครดิตให้อัตโนมัติ
              </li>
              <li>
                โดยทั่วไปค่าบริการที่ชำระแล้ว<strong>ไม่สามารถขอคืนได้</strong>
                เว้นแต่ความผิดพลาดเกิดจากระบบของเรา — กรณีดังกล่าวติดต่อ{' '}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#E63946] underline">
                  {LEGAL_CONTACT_EMAIL}
                </a>
              </li>
              <li>ราคาอาจเปลี่ยนแปลงได้ โดยไม่กระทบรายการที่ชำระเงินไปแล้ว</li>
            </ul>
          </Section>

          <Section title="5. เนื้อหาของผู้ใช้">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                เนื้อหาที่ท่านอัปโหลดยังคงเป็นของท่าน
                โดยท่านอนุญาตให้เราจัดเก็บ ประมวลผล และแสดงผลเนื้อหานั้นเท่าที่จำเป็นต่อการให้บริการ
              </li>
              <li>
                ท่านรับรองว่าเป็นเจ้าของหรือมีสิทธิ์ในเนื้อหาที่อัปโหลด
                รวมถึงได้รับความยินยอมจากบุคคลที่ปรากฏในรูปภาพ/เสียงแล้ว
              </li>
              <li>
                ห้ามอัปโหลดเนื้อหาที่ผิดกฎหมาย ละเมิดลิขสิทธิ์ ลามกอนาจาร
                เกี่ยวข้องกับผู้เยาว์ในทางไม่เหมาะสม หมิ่นประมาท สร้างความเกลียดชัง
                หรือละเมิดสิทธิ์ของบุคคลอื่น
              </li>
              <li>
                เราขอสงวนสิทธิ์ลบเนื้อหาหรือระงับบัญชีที่ฝ่าฝืนข้อกำหนด
                โดยไม่จำเป็นต้องแจ้งล่วงหน้าและไม่คืนค่าบริการ
              </li>
            </ul>
          </Section>

          <Section title="6. การแชร์และฟีเจอร์จักรวาล">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                ความทรงจำที่เปิดใช้งานแล้วเข้าถึงได้โดยทุกคนที่มีลิงก์
                ท่านเป็นผู้ตัดสินใจว่าจะแชร์ลิงก์ให้ใคร
              </li>
              <li>
                เรื่องราวประเภทรูปภาพและข้อความจะแสดงในฟีดจักรวาลโดยค่าเริ่มต้น
                ซึ่งรวมถึงเรื่องราวที่อยู่หลังรหัส PIN ด้วย
                (รหัส PIN ใช้ป้องกันลำดับการเปิดดูผ่านลิงก์เท่านั้น)
                ท่านปิดการแชร์ของแต่ละความทรงจำได้ทุกเมื่อ
              </li>
              <li>
                การกดรีแอคชันต่อเรื่องราวของผู้อื่นต้องเป็นไปอย่างให้เกียรติ
                เราขอสงวนสิทธิ์ระงับการใช้งานหากพบการใช้ในทางที่ผิด
              </li>
            </ul>
          </Section>

          <Section title="7. ทรัพย์สินทางปัญญาของเรา">
            <p>
              โลโก้ ดีไซน์ ซอฟต์แวร์ และส่วนประกอบของบริการ (ยกเว้นเนื้อหาของผู้ใช้)
              เป็นทรัพย์สินของ {SERVICE_NAME} ห้ามทำซ้ำ ดัดแปลง
              หรือนำไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
            </p>
          </Section>

          <Section title="8. ข้อจำกัดความรับผิด">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                บริการให้บริการ &ldquo;ตามสภาพ&rdquo; (as is)
                เราไม่รับประกันว่าบริการจะไม่หยุดชะงักหรือปราศจากข้อผิดพลาด
              </li>
              <li>
                เราไม่รับผิดต่อความเสียหายทางอ้อมหรือการสูญเสียข้อมูลที่อยู่นอกเหนือการควบคุมตามสมควรของเรา
                ความรับผิดรวมสูงสุดของเราจำกัดไม่เกินจำนวนเงินที่ท่านชำระให้เราในช่วง 12 เดือนที่ผ่านมา
              </li>
              <li>
                เราแนะนำให้ท่านเก็บสำเนาต้นฉบับของรูปภาพ/ไฟล์สำคัญไว้เสมอ
              </li>
            </ul>
          </Section>

          <Section title="9. การระงับและยกเลิกบริการ">
            <p>
              ท่านสามารถหยุดใช้บริการและขอลบบัญชีได้ทุกเมื่อ
              เราอาจระงับหรือยกเลิกบัญชีที่ฝ่าฝืนข้อกำหนดฉบับนี้
              หากบริการต้องปิดตัวลง เราจะแจ้งให้ทราบล่วงหน้าตามสมควรเพื่อให้ท่านสำรองเนื้อหา
            </p>
          </Section>

          <Section title="10. กฎหมายที่ใช้บังคับ">
            <p>
              ข้อกำหนดฉบับนี้อยู่ภายใต้บังคับของกฎหมายแห่งราชอาณาจักรไทย
              ข้อพิพาทใดๆ ให้อยู่ในเขตอำนาจของศาลไทย
            </p>
          </Section>

          <Section title="11. การเปลี่ยนแปลงข้อกำหนด">
            <p>
              เราอาจปรับปรุงข้อกำหนดนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงที่สำคัญ
              เราจะแจ้งให้ท่านทราบและขอความยินยอมใหม่ผ่านระบบก่อนใช้งานต่อ
            </p>
          </Section>

          <Section title="12. ติดต่อเรา">
            <p>
              หากมีข้อสงสัยเกี่ยวกับข้อกำหนดการใช้งาน ติดต่อได้ที่{' '}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#E63946] underline">
                {LEGAL_CONTACT_EMAIL}
              </a>
            </p>
          </Section>

          <div className="border-t border-pink-100 pt-6 text-center">
            <Link href="/privacy" className="text-sm text-[#E63946] hover:underline">
              อ่านนโยบายความเป็นส่วนตัว →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
