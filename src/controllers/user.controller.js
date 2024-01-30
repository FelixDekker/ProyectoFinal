import DaoFactory from '../dao/daoFactory.js';
import UserDto from '../dto/userDto.js';
import nodemailer from 'nodemailer'; 

const userDao = DaoFactory.createDao('user');

class UserController {
  async deleteUser(req, res) {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.remove();

      await sendAccountDeletionEmail(user.email);

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async register(req, res) {
    try {
      const { email, password } = req.body;
      const newUser = await userDao.register(email, password);
      req.session.user = { id: newUser._id, email: newUser.email, role: newUser.role };
      const userDto = new UserDto(newUser);
      return res.status(201).json({ message: 'Registration successful', user: userDto });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userDao.login(email, password);
      req.session.user = { id: user._id, email: user.email, role: user.role };
      const userDto = new UserDto(user);
      return res.status(200).json({ message: 'Login successful', user: userDto });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      await userDao.logout(req);
      return res.redirect('/login');
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

async function sendAccountDeletionEmail(email) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your_email@gmail.com', 
        pass: 'your_password', 
      },
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: email,
      subject: 'Account Deletion Notification',
      text: 'Your account has been deleted due to inactivity.',
    };

    await transporter.sendMail(mailOptions);
    console.log('Account deletion email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending account deletion email:', error);
  }
}

export default UserController;
